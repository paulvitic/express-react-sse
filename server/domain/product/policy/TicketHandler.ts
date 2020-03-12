import EventListener from "../../EventListener";
import * as E from "fp-ts/lib/Either";
import TicketUpdateCollectionRepository from "../repository/TicketUpdateCollectionRepository";
import EventBus from "../../EventBus";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import TicketUpdateCollection from "../TicketUpdateCollection";
import LogFactory from "../../LogFactory";
import {TicketChanged} from "../event";

type TicketEvents = TicketChanged;

export class TicketHandler implements EventListener<TicketEvents> {
    private readonly log = LogFactory.get(TicketHandler.name);

    constructor(private readonly repo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus){}

    onEvent(event: TicketEvents): Promise<E.Either<Error, void>> {
            // latest collection state can only be pending, failed or blocked
        return new Promise<E.Either<Error,void>>((resolve, reject) => {
            switch (event.eventType) {
                case TicketChanged.name:
                    this.handleTicketChanged(event as TicketChanged)
                        .run().then(res => res ? resolve() : reject());
                    return;
            }
        })
    }

    private handleTicketChanged = (event: TicketChanged): TE.TaskEither<Error, void> => {
        this.log.info(`Handling ${event.eventType}`);
        return TE.taskEither.of(null);
        /*return pipe(
            this.repo.findLatestByProject(event.aggregateId),
            TE.chain(optional => optional.isSome() ?
                TE.right2v(optional.value) :
                this.create(event.aggregateId, event.ticketBoardKey, new Date(event.prodDevStartDate))),
            TE.chainFirst(collection => TE.fromEither(collection.unBlock())),
            TE.chainFirst(coll => this.repo.update(coll.id, coll)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chain(collection => TE.rightIO(this.log.io.info(`Pending ticket update collection ${collection} created.`)))
        )*/
    };

    private create = (prodDevId: string, ticketBoardKey: string, from: Date):
        TE.TaskEither<Error, TicketUpdateCollection> => {
        return pipe(
            TE.fromEither(TicketUpdateCollection.create(prodDevId, ticketBoardKey, from)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    }
}
