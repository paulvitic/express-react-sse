import {AggregateRoot} from "./AggregateRoot";

export default interface EventPublisher {
    publishEventsOf(aggregate: AggregateRoot): void
}
