import DomainEvent from "./DomainEvent";

export default interface EventListener<T extends DomainEvent> {
    onEvent(event: T): T | void;
}
