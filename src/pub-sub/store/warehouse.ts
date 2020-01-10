import { sleep } from '../../utils/tools';
import { IOrder } from '../typing';
import { EventCenter, Subject, Subscriber } from '../base';
import Events from './events';
import store from './data';
interface IStoreData {
    [x: string]: number;
}

interface IWarehouseOption {
    name: string;
    managerCount: number;
}

class WareHouseManager extends Subscriber {
    private boundWareHouse: WareHouse;
    private serving: string;
    private order: IOrder;
    private finishedItem: { [x: string]: boolean }
    constructor(
        public name: string,
        warehouse: WareHouse
    ) {
        super(name);
        this.init(warehouse);
    }

    isIdle() {
        return !this.serving;
    }

    registerToWarehouse(warehouse: WareHouse) {
        warehouse.registerManager(this);
        this.boundWareHouse = warehouse;
    }

    startOrder(order: IOrder) {
        if (this.serving) {
            throw new Error(`Manger (${this.name}) is serving`);
        }
        console.log(this.name, 'start order', order, '\n');
        const content = order.content;
        const keys = Object.keys(content);
        if (keys.length === 0) {
            throw new Error("Invalid order");
        }
        if (keys.some(i => content[i] < 1)) {
            throw new Error("Invalid order");
        }
        this.order = order;
        this.serving = order.bound_user;
        keys.forEach(name => {
            this.getGoods(name, content[name]);
        });
    }

    finishOrder(id: string, success: boolean, message?: string) {
        const orderFinishedSubject = new Subject(success ? Events.ORDER_SUCCESS : Events.ORDER_FAILED);
        const idleSubject = new Subject(Events.HAS_IDLE_MANAGER);
        orderFinishedSubject.notify(this.boundWareHouse.getEC(), id, message);
        idleSubject.notify(this.boundWareHouse.getEC());
        this.serving = '';
        this.finishedItem = {};
    }

    getGoods(name: string, count: number) {
        this.boundWareHouse.getGoods(name, count, this.name);
    }

    private init(warehouse: WareHouse) {
        this.finishedItem = {};
        this.registerToWarehouse(warehouse);
        this.subscribe(`${Events.GET_GOODS_SUCCESS}_${this.name}`, this.boundWareHouse.getEC(), (name: string) => {
            let content = this.order.content;
            this.finishedItem[name] = true;

            if (Object.keys(content).length === Object.keys(this.finishedItem).length) {
                console.log('Store: ', this.boundWareHouse.store, this.order.content, '\n');
                this.finishOrder(this.order.bound_user, true);
            }
        });
        this.subscribe(`${Events.GET_GOODS_FAILED}_${this.name}`, this.boundWareHouse.getEC(), (name: string, message: string) => {
            this.finishOrder(this.order.bound_user, false, `${name} - ${message}`);
        });
    }
}

class WareHouseManagerDispatcher extends Subscriber {
    private managers: WareHouseManager[] = [];
    constructor(
        public name: string,
    ) {
        super(name);
    }

    hasIdleManager() {
        return this.managers.find(m => m.isIdle())
    }

    registerManagers(manager: WareHouseManager) {
        this.managers.push(manager);
    }

    dispatchOrder(order: IOrder) {
        const idleManager = this.hasIdleManager();

        if (idleManager) {
            idleManager.startOrder(order);
            return true;
        } else {
            return false;
        }
    }
}

class WareHouse {
    public name: string;
    public store: IStoreData;
    private managerDispatcher: WareHouseManagerDispatcher;
    private orderQueue: IOrder[];
    constructor(
        options: IWarehouseOption,
        private selfEC: EventCenter,
    ) {
        this.initWarehouse(
            selfEC,
            options
        );
    }

    private initWarehouse(
        selfEC: EventCenter,
        options: IWarehouseOption,
    ) {
        this.name = options.name;
        this.store = store;
        this.selfEC = selfEC;
        this.orderQueue = [];
        this.managerDispatcher = new WareHouseManagerDispatcher("dispatcher");
        for (let i = 0; i < options.managerCount; i ++) {
            this.registerManager(new WareHouseManager(`manager-${i}`, this));
        }
        console.log('manager registered');
        this.managerDispatcher.subscribe(Events.NEW_ORDER, this.getEC(), (order: IOrder) => {
            const success = this.managerDispatcher.dispatchOrder(order);
            if (success) {
                const orderDispatchedSubject = new Subject(Events.ORDER_DISPATCH_SUCCESS);
                orderDispatchedSubject.notify(this.getEC(), order);
            } else {
                this.orderQueue.push(order);
            }
        });
        this.managerDispatcher.subscribe(Events.HAS_IDLE_MANAGER, this.getEC(), () => {
            if (this.orderQueue.length < 1) {
                return;
            }
            const order = this.orderQueue.shift();

            const success = this.managerDispatcher.dispatchOrder(order);
            if (success) {
                const orderDispatchedSubject = new Subject(Events.ORDER_DISPATCH_SUCCESS);
                orderDispatchedSubject.notify(this.getEC(), order);
            } else {
                this.orderQueue.unshift(order);
            }
        });
    }

    getEC() {
        return this.selfEC;
    }

    registerManager(manager: WareHouseManager) {
        this.managerDispatcher.registerManagers(manager);
    }

    async getGoods(name: string, count: number, managerName: string) {
        const storeCount = this.store[name];

        if (storeCount >= count) {
            const successSubject = new Subject(`${Events.GET_GOODS_SUCCESS}_${managerName}`);
            this.store[name] = this.store[name] - count;
            await sleep(Math.round(Math.random() * 500 + 1000));
            successSubject.notify(this.getEC(), name);
        } else {
            const failedSubject = new Subject(`${Events.GET_GOODS_FAILED}_${managerName}`);
            await sleep(Math.round(Math.random() * 500 + 1000));
            failedSubject.notify(this.getEC(), name, 'Insufficient store');
        }
    }
}

export default WareHouse;