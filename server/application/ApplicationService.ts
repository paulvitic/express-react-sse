import EventBus from "../domain/EventBus";
import AggregateRoot from "../domain/AggregateRoot";
import {Repository} from "../domain/Repository";

export default abstract class ApplicationService<T extends AggregateRoot> {
    protected constructor(private readonly eventBus: EventBus) {}

    protected aggregateState(is: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            reject(new Error('not implemented'))
        })
    }

    protected aggregateExists(is: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            reject(new Error('not implemented'))
        })
    }

    publishEventsOf = async (aggregate: T): Promise<void> => {
        aggregate.publishEventsUsing(this.eventBus.publish);
    };
}
