import * as TE from "fp-ts/lib/TaskEither";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../TicketUpdateCollection";
import {TicketUpdateCollectionRepository} from "../../repository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";

class TicketUpdateCollectionExecutiveError extends Error {
    constructor(message) {
        super(message);
        this.name = TicketUpdateCollectionExecutiveError.name;
    }
}

export class TicketUpdateCollectionExecutive {
    constructor(private readonly repo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus) {}

    start(prodDevId: string, ticketBoardKey: string, prodDevStart: Date):
        TE.TaskEither<Error, boolean> {
        return pipe(
            this.repo.findLatestByProject(prodDevId),
            TE.chain(collection => collection.isSome() ?
                TE.right2v(collection.value) :
                this.create(prodDevId, ticketBoardKey, prodDevStart)),
            TE.chain(collection => collection.status === TicketUpdateCollectionStatus.COMPLETED ?
                this.create(prodDevId, ticketBoardKey, collection.period.to) :
                TE.right2v(collection)),
            TE.chainFirst(collection => TE.fromEither(collection.start(prodDevStart))),
            TE.chainFirst(collection => this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection))
        )
    }

    private create = (prodDevId: string, ticketBoardKey: string, from: Date):
        TE.TaskEither<Error, TicketUpdateCollection> => {
        return pipe(
            TE.fromEither(TicketUpdateCollection.create(prodDevId, ticketBoardKey, from)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    }
}
