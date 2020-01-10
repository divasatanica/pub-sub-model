import Customer from '../customer/customer';
import { EventCenter, Subscriber } from '../base';
import { IOrder } from '../typing';
import Warehouse from './warehouse';
import FrontEnd from './frontend';

interface IStoreOptions {
    managerCount: number;
}

export default class Store {
    public warehouse: Warehouse;
    public frontEnd: FrontEnd;
    constructor(
        public name: string,
        options: IStoreOptions
    ) {
        this.init(options);
    }

    private init(options: IStoreOptions) {
        console.log("init store")
        this.warehouse = new Warehouse(
            {
                name: 'warehouse',
                managerCount: options.managerCount
            },
            new EventCenter('warehouse-ec')
        );
        this.frontEnd = new FrontEnd(
            'frontend',
            new EventCenter('frontend-ec'),
            new Subscriber('frontend-subscriber'),
            this.warehouse
        );
    }

    purchase(order: IOrder, customer: Customer) {
        this.frontEnd.generateOrder(order, customer);
    }

    subscribe(event: string, subscriber: Subscriber, cb: Function) {
        subscriber.subscribe(event, this.frontEnd.getEC(), cb); 
    }

    unsubscribe(event: string, subscriber: Subscriber) {
        subscriber.unsubscribe(event, this.frontEnd.getEC());
    }
}
