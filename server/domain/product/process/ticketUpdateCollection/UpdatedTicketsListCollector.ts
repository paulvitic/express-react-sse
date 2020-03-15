import EventBus from "../../../EventBus";
import TicketBoardIntegration from "../../service/TicketBoardIntegration";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {
    TicketUpdateCollectionStarted} from "../../event";
import LogFactory from "../../../LogFactory";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection from "../../TicketUpdateCollection";

export default class UpdatedTicketsListCollector extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(UpdatedTicketsListCollector.name);
    constructor(repo: TicketUpdateCollectionRepository,
                eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
        super(repo, eventBus)
    }

    onEvent(sourceEvent: TicketUpdateCollectionStarted): Promise<E.Either<Error, boolean>> {
        this.log.info(`Processing event ${sourceEvent.eventType}`);
        return pipe(
            this.repo.findById(sourceEvent.aggregateId),
            TE.chain(collection => collection.isNone() ?
                TE.left2v(new Error('collection does not exists')) :
                TE.right2v(collection.value)),
            TE.chainFirst(collection => this.fetchUpdatedTicketsList(sourceEvent, collection)),
            TE.chain(collection => this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection)),
        ).run();
    }

    fetchUpdatedTicketsList(sourceEvent: TicketUpdateCollectionStarted, collection: TicketUpdateCollection):
        TE.TaskEither<Error,void> {
        return this.integration.getUpdatedTickets(sourceEvent.ticketBoardKey, new Date(sourceEvent.fromDate), new Date(sourceEvent.toDate))
            .foldTaskEither(
                err => TE.fromEither(collection.failCollection(UpdatedTicketsListCollector.name, err.message)),
                updatedTickets => TE.fromEither(collection.willReadTickets(updatedTickets)))
    }
}
