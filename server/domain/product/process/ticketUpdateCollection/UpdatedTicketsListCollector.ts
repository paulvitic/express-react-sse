import EventBus from "../../../EventBus";
import TicketBoardIntegration from "../../service/TicketBoardIntegration";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {
    TicketUpdateCollectionStarted} from "../../event";
import LogFactory from "../../../LogFactory";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";
import {TicketUpdateCollectionRepository} from "../../repository";
import TicketUpdateCollection from "../../TicketUpdateCollection";

export default class UpdatedTicketsListCollector extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(UpdatedTicketsListCollector.name);
    constructor(repo: TicketUpdateCollectionRepository,
                eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
        super(repo, eventBus)
    }

    onEvent(event: TicketUpdateCollectionStarted): Promise<E.Either<Error, boolean>> {
        this.log.info(`Processing event ${event.eventType}`);
        return pipe(
            this.repo.findById(event.aggregateId),
            TE.chain(collection => collection.isNone() ?
                TE.left2v(new Error('collection does not exists')) :
                TE.right2v(collection.value)),
            TE.chainFirst(collection => this.fetchUpdatedTicketsList(event, collection)),
            TE.chain(collection => this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection)),
        ).run();
    }

    fetchUpdatedTicketsList(event: TicketUpdateCollectionStarted, collection: TicketUpdateCollection):
        TE.TaskEither<Error,void> {
        return this.integration.getUpdatedTickets(event.ticketBoardKey, new Date(event.fromDate), new Date(event.toDate))
            .foldTaskEither(
                err => TE.fromEither(collection.fail(UpdatedTicketsListCollector.name, err.message)),
                updatedTickets => TE.fromEither(collection.willReadTickets(event.prodDevStartedOn, updatedTickets)))
    }
}
