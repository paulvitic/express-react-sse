import DomainEvent from "./DomainEvent";
import * as TE from "fp-ts/lib/TaskEither";
import EventListener from "./EventListener";
import AggregateRoot from "./AggregateRoot";

//export type EventHandler = <T extends DomainEvent = DomainEvent, S extends DomainEvent = DomainEvent>(event: T) => Promise<S> | Promise<void>;

/**
 *
 */
export default interface EventBus {
    subscribe(handler: EventListener, eventTypes: string[]): void
    publishEvent<T extends DomainEvent = DomainEvent>(event: T): TE.TaskEither<Error, boolean>
    publishEventsOf(aggregate: AggregateRoot): TE.TaskEither<Error, boolean>
}
