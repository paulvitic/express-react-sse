import EventListener from "../../../EventListener";
import DomainEvent from "../../../DomainEvent";
import {Either} from "fp-ts/lib/Either";
import EventBus from "../../../EventBus";

export abstract class TicketUpdateCollectionProcess implements EventListener {

    protected constructor(protected readonly eventBus: EventBus){}

    abstract onEvent(event: DomainEvent): Promise<Either<Error, void>>;
}

