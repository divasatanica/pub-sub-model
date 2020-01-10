import { Subscriber, EventCenter, Subject } from '../base';
import { IOrder } from '../typing';
import Customer from '../customer/customer';
import Events from './events';
import WareHouse from './warehouse';

class FrontEnd {
    private bufferCustomers: Customer[];
    private customers: Customer[];
    public boundWareHouse: WareHouse;
    constructor(
        public name: string,
        private selfEC: EventCenter,
        private warehouseSubsciber: Subscriber,
        warehouse: WareHouse,
    ) {
        this.name = name;
        this.init(
            warehouse,
            selfEC,
            warehouseSubsciber
        );
    }

    private init(
        warehouse: WareHouse,
        frontEC: EventCenter,
        warehouseSubsciber: Subscriber
    ) {
        this.customers = [];
        this.bufferCustomers = [];
        this.selfEC = frontEC;
        this.warehouseSubsciber = warehouseSubsciber;
        this.registerToWareHouse(warehouse);
        this.warehouseSubsciber.subscribe(Events.ORDER_DISPATCH_SUCCESS, this.boundWareHouse.getEC(), (order: IOrder) => {
            const index = this.bufferCustomers.findIndex(i => i.name === order.bound_user);
            if (index > -1) {
                const customer = this.bufferCustomers[index];
                this.customers.push(customer);
                customer.setOrder(order);
                this.bufferCustomers.splice(index, 1);
            }
        });
        this.warehouseSubsciber.subscribe(Events.ORDER_SUCCESS, this.boundWareHouse.getEC(), (id: string) => {
            const index = this.customers.findIndex(i => i.name === id);

            this.customers.splice(index, 1);
            const orderFinishSubject = new Subject(`${Events.ORDER_SUCCESS}_${id}`);
            orderFinishSubject.notify(this.getEC(), id);
        });
        this.warehouseSubsciber.subscribe(Events.ORDER_FAILED, this.boundWareHouse.getEC(), (id: string, message: string) => {
            const index = this.customers.findIndex(i => i.name === id);

            this.customers.splice(index, 1);
            const orderFinishSubject = new Subject(`${Events.ORDER_FAILED}_${id}`);
            orderFinishSubject.notify(this.getEC(), id, message);
        });
    }

    getEC() {
        return this.selfEC;
    }

    registerToWareHouse(warehouse: WareHouse) {
        this.boundWareHouse = warehouse;
    }

    generateOrder(order: IOrder, customer: Customer) {
        const newOrderSubject = new Subject(Events.NEW_ORDER);
        console.log(`generate order for ${customer.name}`);
        newOrderSubject.notify(this.boundWareHouse.getEC(), order);
        this.bufferCustomers.push(customer);
    }
}

export default FrontEnd;