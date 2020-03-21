import LogFactory from "../../../LogFactory";
import EventBus from "../../../EventBus";
import TicketBoardIntegration, {UpdatedTicket} from "../../service/TicketBoardIntegration";
import {
    UpdatedTicketsListFetched
} from "../../event";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {array} from "fp-ts/lib/Array";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";
import {TicketUpdateCollectionRepository} from "../../repository";
import TicketUpdateCollection from "../../TicketUpdateCollection";
import {TicketHistoryQueryService} from "../../service/TicketHistoryQueryService";

export default class TicketChangeLogReader extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(TicketChangeLogReader.name);
    constructor(repo: TicketUpdateCollectionRepository,
                eventBus: EventBus,
                private readonly integration: TicketBoardIntegration,
                private readonly ticketHistory: TicketHistoryQueryService) {
        super(repo, eventBus)
    }

    onEvent(event: UpdatedTicketsListFetched): Promise<E.Either<Error, boolean>> {
        this.log.debug(`Processing ${UpdatedTicketsListFetched.name} event`);
        return pipe(
            this.repo.findById(event.aggregateId),
            TE.chain(collection => collection.isNone() ?
                TE.left2v(new Error('collection does not exists')) :
                TE.right2v(collection.value)),
            TE.chainFirst(collection => this.readUpdatedTicketsChangeLogs(event, collection)),
            TE.chain(collection => this.repo.update(collection.id, collection)),
            TE.chain(collection => this.eventBus.publishEventsOf(collection)),
        ).run();
    }

    readUpdatedTicketsChangeLogs(event: UpdatedTicketsListFetched, collection: TicketUpdateCollection):
        TE.TaskEither<Error,void> {
        return array.reduce(event.updatedTickets, TE.taskEither.of(null), (previous, current) => {
            return previous.foldTaskEither(
                err => TE.left2v(err),
                () => this.readTicketChangeLog(event, collection, current))
        });
    }

    private readTicketChangeLog(event: UpdatedTicketsListFetched, collection: TicketUpdateCollection, updatedTicket: UpdatedTicket):
        TE.TaskEither<Error,void>{
        return pipe(
            this.ticketHistory.findLatestByTicketRef(updatedTicket.ref),
            TE.chain(optionalTicketHistory => optionalTicketHistory.foldL(
                () => TE.right2v(new Date(event.prodDevStartedOn)),
                history => TE.right2v(history.startedAt)
            )),
            TE.chain(fromDate => this.integration.readTicketChangeLog(updatedTicket.key, fromDate, new Date(event.toDate))
                .foldTaskEither(
                    err => TE.fromEither(collection.fail(TicketChangeLogReader.name, err.message)),
                    optionalResponse => TE.fromEither(optionalResponse.foldL(
                        () => collection.completedForTicket(event.prodDevStartedOn, updatedTicket.ref, updatedTicket.key),
                        response => collection.completedForTicket(event.prodDevStartedOn, updatedTicket.ref, updatedTicket.key, response)
                    ))
                )
            )
        )
    }
}
