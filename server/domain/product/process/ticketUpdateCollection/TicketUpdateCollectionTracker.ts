import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../TicketUpdateCollection";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";
import {NextTicketUpdateCollectionPeriod} from "../../view/NextTicketUpdateCollectionPeriod";
import {
    TicketChanged,
    TicketRemainedUnchanged,
    TicketUpdateCollectionEnded,
    TicketUpdateCollectionFailed,
    TicketUpdateCollectionStarted,
    UpdatedTicketsListFetched
} from "../../event";
import EventListener from "../../../EventListener";
import {TicketChangeLogEvent} from "./TicketChangeLogReader";
import LogFactory from "../../../LogFactory";

type TicketUpdateCollectionExecutiveEvent =
    TicketUpdateCollectionFailed |
    UpdatedTicketsListFetched |
    TicketChanged |
    TicketRemainedUnchanged;

export class TicketUpdateCollectionTracker implements EventListener<TicketUpdateCollectionExecutiveEvent> {
    private readonly log = LogFactory.get(TicketUpdateCollectionTracker.name);

    constructor(private readonly repo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus) {
    }

    start(nextCollectionPeriod: NextTicketUpdateCollectionPeriod): TE.TaskEither<Error, boolean> {
        return pipe(
            this.repo.findByStatus(TicketUpdateCollectionStatus.RUNNING),
            TE.filterOrElse(running => running.length === 0,
                () => new Error('A ticket update collection is already running.')),
            TE.chain(() => TE.fromEither(TicketUpdateCollection.create(nextCollectionPeriod))),
            TE.chain(collection => this.repo.save(collection)), // FIXME we cant save we have to update
            TE.chain( collection => this.eventBus.publishEvent(new TicketUpdateCollectionStarted(
                    TicketUpdateCollection.name,
                    collection.id,
                    collection.productDevId,
                    nextCollectionPeriod.ticketBoardKey,
                    collection.period)
            ))
        )
    }

    onEvent = async (sourceEvent: TicketUpdateCollectionExecutiveEvent): Promise<E.Either<Error, void>> => {
        this.log.info(`Processing event ${JSON.stringify(sourceEvent)}`);
        return new Promise<E.Either<Error,void>>(resolve => {
            pipe(
                this.repo.findLatestByProject(sourceEvent.prodDevId),
                TE.chain(collection => collection.isSome() ?
                    TE.fromEither(this.handleEvent(sourceEvent, collection.value)) :
                    TE.leftTask(T.task.of(new Error('collection does not exists')))),
                TE.chain( collection => this.repo.update(collection.id, collection)),
                TE.chain(collection => collection.status!==TicketUpdateCollectionStatus.RUNNING ?
                    this.eventBus.publishEvent(new TicketUpdateCollectionEnded(
                        TicketUpdateCollection.name,
                        collection.id,
                        collection.productDevId)) :
                    TE.taskEither.of(null))
            ).run().then(res => resolve(res))
        })
    };

    handleEvent(sourceEvent: TicketUpdateCollectionExecutiveEvent, collection: TicketUpdateCollection):
        E.Either<Error, TicketUpdateCollection> {
        switch (sourceEvent.eventType) {
            case UpdatedTicketsListFetched.name:
                return pipe(
                    E.either.of(<UpdatedTicketsListFetched>sourceEvent),
                    E.chain(event => collection.willRunForTickets(event.updatedTickets)),
                    E.map(() => collection)
                );
            case TicketChanged.name:
            case TicketRemainedUnchanged.name:
                return pipe(
                    E.either.of(<TicketChangeLogEvent>sourceEvent),
                    E.chain(event => collection.completedForTicket(event.ticketExternalRef, event.ticketKey)),
                    E.map(() => collection)
                );
            case TicketUpdateCollectionFailed.name:
                return pipe(
                    E.either.of(<TicketUpdateCollectionFailed>sourceEvent),
                    E.chain(() => collection.failed()),
                    E.map(() => collection)
                );
        }
    }
}
