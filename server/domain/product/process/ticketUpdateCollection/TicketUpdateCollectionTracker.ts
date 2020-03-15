import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../TicketUpdateCollection";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";
import LogFactory from "../../../LogFactory";

class TicketUpdateCollectionTrackerError extends Error {
    constructor(message) {
        super(message);
        this.name = TicketUpdateCollectionTrackerError.name;
    }
}

export class TicketUpdateCollectionTracker {
    private readonly log = LogFactory.get(TicketUpdateCollectionTracker.name);
    constructor(private readonly repo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus) {}

    start(prodDevId: string, ticketBoardKey: string, prodDevStart: Date, defaultFrom: Date):
        TE.TaskEither<Error, boolean> {
        return pipe(
            this.repo.findLatestByProject(prodDevId),
            TE.chain(collection => collection.isSome() ?
                TE.right2v(collection.value) :
                this.create(prodDevId, ticketBoardKey, prodDevStart, defaultFrom)),
            TE.chain(collection => collection.status === TicketUpdateCollectionStatus.COMPLETED ?
                this.create(prodDevId, ticketBoardKey, collection.startedAt, collection.period.to) :
                TE.right2v(collection)),
            TE.chainFirst(collection => TE.fromEither(collection.startCollection())),
            TE.chainFirst(collection => this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection))
        )
    }

    private create = (prodDevId: string, ticketBoardKey: string, prodDevStart: Date, defaultFrom?: Date):
        TE.TaskEither<Error, TicketUpdateCollection> => {
        let from = defaultFrom ? defaultFrom : prodDevStart;
        return pipe(
            TE.fromEither(TicketUpdateCollection.create(prodDevId, ticketBoardKey, from)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    }
}
