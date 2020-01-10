interface ICallbackMap {
    [x: string]: Function;
}

interface ISubscribersMap {
    [x: string]: ISubscriber[];
}

interface IOrder {
    bound_user: string;
    content: {[x: string]: number};
}

interface ISubject {
    name: string;
    notify(ec: IEventCenter): void;
}

interface ISubscriber {
    name: string;
    callbacks: ICallbackMap;
    notify(event: string, ...args: any[]): void;
    subscribe(event: string, ec: IEventCenter, cb: Function): void;
}

interface IEventCenter {
    name: string;
    subscribersMap: ISubscribersMap;
    publish(event: string, ...args: any[]): void;
    subscribe(event: string, subscriber: ISubscriber): void;
    unsubscribe(event: string, subscriber: ISubscriber): void;
}

export {
    ISubscriber,
    IEventCenter,
    ISubject,
    ICallbackMap,
    ISubscribersMap,
    IOrder
}