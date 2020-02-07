import EventBus from "../domain/EventBus";
import AggregateRoot from "../domain/AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";

export default abstract class ApplicationService<A extends AggregateRoot> {
    protected constructor(private readonly eventBus: EventBus) {}

    protected aggregateState(is: string): Promise<A> {
        return new Promise<A>((resolve, reject) => {
            reject(new Error('not implemented'))
        })
    }

    protected aggregateExists(is: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            reject(new Error('not implemented'))
        })
    }

    publishEvents = (aggregate: A): TE.TaskEither<Error, void> => {
        return aggregate.publishEventsUsing(this.eventBus.publishEvent);
    };
}
