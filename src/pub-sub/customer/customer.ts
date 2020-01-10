import { IOrder } from '../typing';
import Store from '../store/store';
import { Subscriber } from '../base';
import events from '../store/events';

export default class Customer extends Subscriber {
    public order: IOrder;
    constructor(
        public name: string
    ) {
        super(name);
        this.init();
    }

    setOrder(order: IOrder) {
        this.order = order;
    }

    purchase(order: IOrder, store: Store) {
        return new Promise((resolve) => {
            store.purchase(order, this);
            store.subscribe(`${events.ORDER_FAILED}_${this.name}`, this, (id: string, message: string) => {
                const result = {
                    success: false,
                    order: this.order,
                    message
                }
                this.order = null;
                store.unsubscribe(`${events.ORDER_FAILED}_${this.name}`, this);
                resolve(result);
            });
            store.subscribe(`${events.ORDER_SUCCESS}_${this.name}`, this, () => {
                const result = {
                    success: true,
                    order: this.order
                }
                this.order = null;
                store.unsubscribe(`${events.ORDER_SUCCESS}_${this.name}`, this);
                console.timeEnd(this.name);
                console.log("resolve", this.name);
                resolve(result);
            });
        });
    }

    private init() {

    }
}