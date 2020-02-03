import DomainEvent from "./DomainEvent";
import * as TE from "fp-ts/lib/TaskEither";

export default interface EventStore {
    logEvent(event: DomainEvent, published: boolean): TE.TaskEither<Error, boolean>;
    eventsOfAggregate(aggregate: string, aggregateId: string): Promise<DomainEvent[]>;
    eventsOfAggregateSince(aggregate: string, aggregateId: string, since: number): Promise<DomainEvent[]>;
}
