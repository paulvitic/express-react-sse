import * as TE from "fp-ts/lib/TaskEither";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../TicketUpdateCollection";
import {TicketUpdateCollectionRepository} from "../../repository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";
import {TicketUpdateCollectionCompleted} from "../../event";
import * as E from "fp-ts/lib/Either";
import LogFactory from "../../../LogFactory";

export class TicketUpdateCollectionTracker  extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(TicketUpdateCollectionTracker.name);
    constructor(repo: TicketUpdateCollectionRepository,
                eventBus: EventBus) {
        super(repo, eventBus)
    }

    onEvent(event: TicketUpdateCollectionCompleted): Promise<E.Either<Error, boolean>> {
        this.log.debug(`Processing ${TicketUpdateCollectionCompleted.name} event`);
        return pipe(
            this.repo.findLatestByProject(event.prodDevId),
            TE.chain(collection => collection.isSome() ?
                TE.right2v(collection.value) :
                TE.left2v(new Error("previous collection does not exist"))),
            TE.chain(collection => collection.status === TicketUpdateCollectionStatus.COMPLETED ?
                this.create(collection.productDevId, collection.ticketBoardKey, collection.period.to) :
                TE.left2v(new Error("previous collection is not complete"))),
            TE.chainFirst(collection => TE.fromEither(collection.start(new Date(event.prodDevStart)))),
            TE.chainFirst(collection => this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection))
        ).run();
    }

    private create = (prodDevId: string, ticketBoardKey: string, from: Date):
        TE.TaskEither<Error, TicketUpdateCollection> => {
        return pipe(
            TE.fromEither(TicketUpdateCollection.create(prodDevId, ticketBoardKey, from)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    };
}
