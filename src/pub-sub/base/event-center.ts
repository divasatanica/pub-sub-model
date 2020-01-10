import { ISubscriber, IEventCenter, ISubscribersMap } from '../typing';

class EventCenter implements IEventCenter {
    public subscribersMap: ISubscribersMap;
    constructor(
        public name: string
    ) {
        this.subscribersMap = {};
    }

    publish(event: string, ...args: any[]) {
        const subscribers = this.subscribersMap[event];

        if (!subscribers || subscribers.length === 0) {
            return;
        }

        subscribers.forEach((sub: ISubscriber) => {
            sub.notify(event, ...args);
        });
    }

    subscribe(event: string, subscriber: ISubscriber) {
        const _subscribers = this.subscribersMap[event];

        if (!_subscribers) {
            this.subscribersMap[event] = [subscriber];
            return;
        }

        this.subscribersMap[event] = _subscribers.concat([subscriber]);
    }

    unsubscribe(event: string, subscriber: ISubscriber) {
        const _subscribers = this.subscribersMap[event];

        if (!_subscribers) {
            return;
        }

        this.subscribersMap[event] = _subscribers.filter(i => i.name !== subscriber.name);
    } 
}

export default EventCenter;