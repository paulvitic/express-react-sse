import EventBus from "../domain/EventBus";
import AggregateRoot from "../domain/AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import {pipe} from "fp-ts/lib/pipeable";
import {array} from "fp-ts/lib/Array";
import * as M from "fp-ts/lib/Monoid";

export default abstract class ApplicationService<A extends AggregateRoot> {
    protected constructor(private readonly eventBus: EventBus) {}

    publishEventsOf = (aggregate: A): TE.TaskEither<Error, void> => {
        return pipe(
            array.traverse(TE.taskEither)(aggregate.domainEvents, (event) => this.eventBus.publishEvent(event)),
            TE.filterOrElse((deliveries) => M.fold(M.monoidAll)(deliveries),
                () => new Error("Not all events are delivered")),
            TE.chain(() => TE.fromEither(aggregate.clearDomainEvents()))
        );
    };
}
