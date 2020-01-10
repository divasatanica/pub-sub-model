import { ISubject, IEventCenter } from '../typing';

export default class Subject implements ISubject {
    constructor(
        public name: string
    ) {}

    notify(ec: IEventCenter, ...args: any[]) {
        ec.publish(this.name, ...args);
    }
}