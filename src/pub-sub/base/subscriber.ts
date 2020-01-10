import { ISubscriber, IEventCenter, ICallbackMap } from '../typing';

export default class Subscriber implements ISubscriber {
    public callbacks: ICallbackMap = {};
    constructor(
        public name: string
    ) {
        this.callbacks = {};
    }

    subscribe(event: string, ec: IEventCenter, cb: Function) {
        ec.subscribe(event, this);
        this.callbacks[event] = cb;
    }

    unsubscribe(event: string, ec: IEventCenter) {
        ec.unsubscribe(event, this);
        this.callbacks[event] = null;
    }

    notify(event: string, ...args: any[]) {
        const cb = this.callbacks[event];

        if (!cb) {
            return;
        }

        // 这里必须是异步调用
        setTimeout(() => {
            cb.apply(this, args);
        }, 0);
    }
}