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
        return new Promise<E.Either<Error,void>>((resolve, reject) => {
            switch (event.eventType) {
                case TicketBoardLinked.name:
                    this.handleTicketBoardLinked(event as TicketBoardLinked)
                        .run().then(res => res ? resolve() : reject());
                    return;
                case TicketBoardRemoved.name:
                    this.handleTicketBoardRemoved(event as TicketBoardRemoved)
                        .run().then(res => res ? resolve() : reject());
                    return;
                case TicketUpdateCollectionCompleted.name:
                    return this.handleTicketUpdateCollectionCompleted(event as TicketUpdateCollectionCompleted)
                        .run().then(res => res ? resolve() : reject());
            }
        })
    }

    private handleTicketBoardLinked = (event: TicketBoardLinked): TE.TaskEither<Error, void> => {
        return pipe(
            this.repo.findLatestByProject(event.aggregateId),
            TE.chain(optional => optional.isSome() ?
                TE.right2v(optional.value) :
                this.create(event.aggregateId, event.ticketBoardKey, new Date(event.prodDevStartDate))),
            TE.chainFirst(collection => TE.fromEither(collection.unBlock())),
            TE.chainFirst(coll => this.repo.update(coll.id, coll)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chain(collection => TE.rightIO(this.log.io.info(`Pending ticket update collection ${collection} created.`)))
        )
    };

    private handleTicketUpdateCollectionCompleted = (event: TicketUpdateCollectionCompleted): TE.TaskEither<Error, void> => {
        // create a new pending collection for next day
        return pipe(
            TE.fromEither(TicketUpdateCollection.createPending(event.prodDevId, null, null)), // FIXME
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save),
            TE.chain(collection => TE.rightIO(this.log.io.info(`Pending ticket update collection ${collection} created.`))),
        )
    };

    private handleTicketBoardRemoved = (event: TicketBoardRemoved): TE.TaskEither<Error, void> => {
        // on ticked board removed block a failed or pending collection
        return TE.left2v(new Error("not implemented"))
    };

    private create = (prodDevId: string, ticketBoardKey: string, from: Date):
        TE.TaskEither<Error, TicketUpdateCollection> => {
        return pipe(
            TE.fromEither(TicketUpdateCollection.createPending(prodDevId, ticketBoardKey, from)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    }
}
