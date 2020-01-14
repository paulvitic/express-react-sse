import DomainEvent from "./DomainEvent";

export default interface EventStore {
    logEvent(event: DomainEvent, published:boolean): Promise<boolean>;
    eventsOfAggregate(aggregate: string, aggregateId: string): Promise<DomainEvent[]>;
    eventsOfAggregateSince(aggregate: string, aggregateId: string, since: number): Promise<DomainEvent[]>;
}
