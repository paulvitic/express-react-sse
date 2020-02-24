import DomainEvent from "./DomainEvent";
import {default as E, Either} from "fp-ts/lib/Either";

export default interface EventListener<EVENT extends DomainEvent> {
    onEvent(event: EVENT): Promise<E.Either<Error, void>>;
}
