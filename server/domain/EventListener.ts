import DomainEvent from "./DomainEvent";

export default interface EventListener<EVENT extends DomainEvent, RETURN_EVENT extends DomainEvent> {
    onEvent(event: EVENT): Promise<RETURN_EVENT> | Promise<boolean>;
}
