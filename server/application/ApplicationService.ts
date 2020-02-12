import EventBus from "../domain/EventBus";
import AggregateRoot from "../domain/AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import {pipe} from "fp-ts/lib/pipeable";
import {array} from "fp-ts/lib/Array";
import * as M from "fp-ts/lib/Monoid";

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

    publishEventsOf = (aggregate: A): TE.TaskEither<Error, void> => {
        return pipe(
            array.traverse(TE.taskEither)(aggregate.domainEvents, (event) => this.eventBus.publishEvent(event)),
            TE.filterOrElse((deliveries) => M.fold(M.monoidAll)(deliveries),
                () => new Error("Not all events are delivered")),
            TE.chain(() => TE.fromEither(aggregate.clearDomainEvents()))
        );
    };
}
