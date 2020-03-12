import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as O from "fp-ts/lib/Option";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../TicketUpdateCollection";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";
import {
    TicketChanged,
    TicketRemainedUnchanged,
    TicketUpdateCollectionFailed,
    UpdatedTicketsListFetched
} from "../../event";
import {TicketChangeLogEvent} from "./TicketChangeLogReader";
import LogFactory from "../../../LogFactory";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";

type TicketUpdateCollectionExecutiveEvent =
    TicketUpdateCollectionFailed |
    UpdatedTicketsListFetched |
    TicketChanged |
    TicketRemainedUnchanged;

class TicketUpdateCollectionTrackerError extends Error {
    constructor(message) {
        super(message);
        this.name = TicketUpdateCollectionTrackerError.name;
    }
}

export class TicketUpdateCollectionTracker extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(TicketUpdateCollectionTracker.name);
    constructor(private readonly repo: TicketUpdateCollectionRepository,
                eventBus: EventBus) {
        super(eventBus)
    }

    start(prodDevId: string, ticketBoardKey: string, prodDevStart: Date, defaultFrom: Date):
        TE.TaskEither<Error, boolean> {
        return pipe(
            this.repo.findLatestByProject(prodDevId),
            TE.chain(collection => collection.isSome() ?
                TE.right2v(collection.value) :
                this.create(prodDevId, ticketBoardKey, defaultFrom, defaultFrom)),
            TE.chainFirst(collection => TE.fromEither(collection.startCollection())),
            TE.chainFirst(collection => this.repo.update(collection.id, collection)),
            TE.chainFirst(collection => TE.rightIO(this.log.io.debug(`ticket update collection updated ${collection}`))),
            TE.chain(collection => this.eventBus.publishEventsOf(collection))
        )
    }

    onEvent = (sourceEvent: TicketUpdateCollectionExecutiveEvent): Promise<E.Either<Error, void>> => {
        this.log.info(`Processing event ${sourceEvent.eventType}`);
        return pipe(
                this.repo.findLatestByProject(sourceEvent.prodDevId),
                TE.chain(collection => collection.isNone() ?
                    TE.leftTask(T.task.of(new Error('collection does not exists'))) :
                    TE.right2v(collection.value)),
                TE.chainFirst(collection => TE.fromEither(this.handleEvent(sourceEvent, collection))),
                TE.chainFirst( collection => TE.fromEither(collection.checkCompleted())),
                TE.chainFirst( collection => this.repo.update(collection.id, collection)),
                TE.chain(collection => this.eventBus.publishEventsOf(collection)),
                TE.chain(() => TE.taskEither.of(null))
            ).run()
    };

    handleEvent(sourceEvent: TicketUpdateCollectionExecutiveEvent, collection: TicketUpdateCollection):
        E.Either<Error, void> {
        switch (sourceEvent.eventType) {
            case UpdatedTicketsListFetched.name:
                return pipe(
                    E.either.of(<UpdatedTicketsListFetched>sourceEvent),
                    E.chain(event => collection.willReadTickets(event.updatedTickets))
                );
            case TicketChanged.name || TicketRemainedUnchanged.name:
                return pipe(
                    E.either.of(<TicketChangeLogEvent>sourceEvent),
                    E.chain(event => collection.completedForTicket(event.ticketRef, event.ticketKey)),
                );
            case TicketUpdateCollectionFailed.name:
                return pipe(
                    E.either.of(<TicketUpdateCollectionFailed>sourceEvent),
                    E.chain(() => collection.failed()),
                );
        }
    }

    private create = (prodDevId: string, ticketBoardKey: string, prodDevStart: Date, defaultFrom: Date):
        TE.TaskEither<Error, TicketUpdateCollection> => {
        let from = defaultFrom ? defaultFrom : prodDevStart;
        return pipe(
            TE.fromEither(TicketUpdateCollection.create(prodDevId, ticketBoardKey, from)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    }
}
