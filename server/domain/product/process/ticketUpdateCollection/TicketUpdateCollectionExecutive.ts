import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import TicketUpdateCollection, {
    TicketUpdateCollectionPeriod,
    TicketUpdateCollectionStatus
} from "../../TicketUpdateCollection";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";
import {NextTicketUpdateCollectionPeriod} from "../../view/NextTicketUpdateCollectionPeriod";
import {TicketUpdateCollectionStarted} from "../../event/TicketUpdateCollectionStarted";
import EventListener from "../../../EventListener";
import {TicketUpdateCollectionFailed} from "../../event/TicketUpdateCollectionFailed";
import {UpdatedTicketsListFetched} from "../../event/UpdatedTicketsListFetched";

type TicketUpdateCollectionExecutiveEvent =
    TicketUpdateCollectionFailed |
    UpdatedTicketsListFetched;

export class TicketUpdateCollectionExecutive implements EventListener<TicketUpdateCollectionExecutiveEvent> {

    constructor(private readonly collectionRepo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus) {
    }

    start(nextCollectionPeriod: NextTicketUpdateCollectionPeriod): TE.TaskEither<Error, boolean> {
        return pipe(
            this.collectionRepo.findByStatus(TicketUpdateCollectionStatus.RUNNING),
            TE.filterOrElse(running => running.length === 0,
                () => new Error('A ticket update collection is already running.')),
            TE.chain(() => TE.fromEither(TicketUpdateCollection.create(nextCollectionPeriod))),
            TE.chain(collection => this.collectionRepo.save(collection)),
            TE.chain( collection => this.eventBus.publishEvent(new TicketUpdateCollectionStarted(
                    TicketUpdateCollection.name,
                    collection.id,
                    collection.nextEventSequence(),
                    collection.devProjectId,
                    nextCollectionPeriod.ticketBoardKey,
                    collection.period)
            ))
        )
    }

    onEvent(event: TicketUpdateCollectionExecutiveEvent): E.Either<Error, void> {
        throw new Error("Method not implemented.");
    }
}
