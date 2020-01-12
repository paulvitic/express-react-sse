import DomainEvent from "./DomainEvent";

export type EventHandler = <T extends DomainEvent = DomainEvent, S extends DomainEvent = DomainEvent>(event: T) => S | void;

/**
 *
 */
export default interface EventBus {
    publish<T extends DomainEvent = DomainEvent>(event: T): Promise<boolean>
    subscribe(eventType: string, handler: EventHandler): Promise<boolean>
}
