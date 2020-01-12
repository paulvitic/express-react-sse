import DomainEvent from "./DomainEvent";

export default interface EventStore {
    logEvent(event: DomainEvent ): Promise<boolean>;
    eventsOfAggregate(aggregate: string, aggregateId: string): Promise<DomainEvent[]>;
    eventsOfAggregateSince(aggregate: string, aggregateId: string, since: Date): Promise<DomainEvent[]>;
}
