import DomainEvent from "./DomainEvent";
import EventListener from "./EventListener";

/**
 *
 */
export default interface EventBus {
    publish(event: DomainEvent): void
    subscribe<T extends DomainEvent>(eventType: string, handler:(event: T) => void): void
}
