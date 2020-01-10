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
        this.getGoods(order);
    }

    finishOrder(id: string, success: boolean, message?: string) {
        const orderFinishedSubject = new Subject(success ? Events.ORDER_SUCCESS : Events.ORDER_FAILED);
        const idleSubject = new Subject(Events.HAS_IDLE_MANAGER);
        orderFinishedSubject.notify(this.boundWareHouse.getEC(), id, message);
        idleSubject.notify(this.boundWareHouse.getEC());
        this.serving = '';
    }

    getGoods(order: IOrder) {
        this.boundWareHouse.getGoods(order, this.name);
    }

    private init(warehouse: WareHouse) {
        this.registerToWarehouse(warehouse);
        this.subscribe(`${Events.GET_GOODS_SUCCESS}_${this.name}`, this.boundWareHouse.getEC(), () => {
            console.log('Store: ', this.boundWareHouse.store, this.order.content, '\n');
            this.finishOrder(this.order.bound_user, true);
        });
        this.subscribe(`${Events.GET_GOODS_FAILED}_${this.name}`, this.boundWareHouse.getEC(), (message: string) => {
            this.finishOrder(this.order.bound_user, false, message);
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

    async getGoods(order: IOrder, managerName: string) {
        const goods = Object.keys(order.content);
        let isStoreValid = true;
        goods.forEach(name => {
            const result = this.checkStore(name, order.content[name]);

            if (!result) {
                isStoreValid = false;
            }
        });

        if (!isStoreValid) {
            const failedSubject = new Subject(`${Events.GET_GOODS_FAILED}_${managerName}`);
            await sleep(Math.round(Math.random() * 1500 + 1000));
            failedSubject.notify(this.getEC(), 'Insufficient store');
        } else {
            const successSubject = new Subject(`${Events.GET_GOODS_SUCCESS}_${managerName}`);
            goods.forEach(name => {
                this.store[name] = this.store[name] - order.content[name];
            });
            await sleep(Math.round(Math.random() * 1500 + 1000));
            successSubject.notify(this.getEC());
        }
    }

    checkStore(name: string, count: number) {
        const storeCount = this.store[name];

        if (!storeCount || storeCount < count) {
            return false;
        }

        return true;
    }
}

export default WareHouse;