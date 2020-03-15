import DomainEvent from "./DomainEvent";
import * as E from "fp-ts/lib/Either";

export default interface EventListener<EVENT extends DomainEvent = DomainEvent> {
    onEvent(event: EVENT): Promise<E.Either<Error, boolean>>;
}
