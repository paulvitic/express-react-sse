import DomainEvent from "./DomainEvent";
import * as TE from "fp-ts/lib/TaskEither";
import EventListener from "./EventListener";

//export type EventHandler = <T extends DomainEvent = DomainEvent, S extends DomainEvent = DomainEvent>(event: T) => Promise<S> | Promise<void>;

/**
 *
 */
export default interface EventBus {
    publishEvent<T extends DomainEvent = DomainEvent>(event: T): TE.TaskEither<Error, boolean>
    subscribe(handler: EventListener, eventTypes: string[]): void
}
