import EventListener from "../../EventListener";
import {TicketBoardLinked, TicketBoardRemoved, TicketUpdateCollectionCompleted} from "../event";
import * as E from "fp-ts/lib/Either";
import TicketUpdateCollectionRepository from "../repository/TicketUpdateCollectionRepository";
import EventBus from "../../EventBus";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import TicketUpdateCollection from "../TicketUpdateCollection";
import LogFactory from "../../LogFactory";

type TicketUpdateCollectionEvents =
    TicketBoardLinked | TicketBoardRemoved| TicketUpdateCollectionCompleted

export class TicketUpdateCollectionHandler implements
    EventListener<TicketUpdateCollectionEvents> {
    private readonly log = LogFactory.get(TicketUpdateCollectionHandler.name);

    constructor(private readonly repo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus){}

    onEvent(event: TicketUpdateCollectionEvents): Promise<E.Either<Error, void>> {
            // latest collection state can only be pending, failed or blocked
            switch (event.eventType) {
                case TicketBoardLinked.name:
                    return this.handleTicketBoardLinked(event as TicketBoardLinked).run();
                case TicketBoardRemoved.name:
                    return this.handleTicketBoardRemoved(event as TicketBoardRemoved).run();
                case TicketUpdateCollectionCompleted.name:
                    return this.handleTicketUpdateCollectionCompleted(event as TicketUpdateCollectionCompleted).run();
                default:
                    return TE.left2v(new Error("error while handling .....")).run();
            }
    }

    private handleTicketBoardLinked = (event: TicketBoardLinked): TE.TaskEither<Error, void> => {
        return pipe(
            this.repo.findLatestByProject(event.aggregateId),
            TE.chain(optional => optional.isSome() ?
                TE.right2v(optional.value) :
                TE.fromEither(TicketUpdateCollection.createPending(null, null, null))), // FIXME
            TE.chainFirst(collection => TE.fromEither(collection.unBlock())),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save),
            TE.chain(collection => TE.rightIO(this.log.io.info(`Pending ticket update collection ${collection} created.`))),
        )
    };

    private handleTicketUpdateCollectionCompleted = (event: TicketUpdateCollectionCompleted): TE.TaskEither<Error, void> => {
        // create a new pending collection for next day
        return pipe(
            TE.fromEither(TicketUpdateCollection.createPending(null, null, null)), // FIXME
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save),
            TE.chain(collection => TE.rightIO(this.log.io.info(`Pending ticket update collection ${collection} created.`))),
        )
    };

    private handleTicketBoardRemoved = (event: TicketBoardRemoved): TE.TaskEither<Error, void> => {
        // on ticked board removed block a failed or pending collection
        return TE.left2v(new Error("not implemented"))
    }
}
