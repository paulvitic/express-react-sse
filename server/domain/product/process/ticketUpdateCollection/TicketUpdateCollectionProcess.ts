import EventListener from "../../../EventListener";
import DomainEvent from "../../../DomainEvent";
import {Either} from "fp-ts/lib/Either";
import EventBus from "../../../EventBus";
import {TicketUpdateCollectionRepository} from "../../repository";

export abstract class TicketUpdateCollectionProcess implements EventListener {
    protected constructor(protected readonly repo: TicketUpdateCollectionRepository,
                          protected readonly eventBus: EventBus){}
    abstract onEvent(event: DomainEvent): Promise<Either<Error, boolean>>;
}

