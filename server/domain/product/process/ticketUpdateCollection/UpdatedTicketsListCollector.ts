import EventListener from "../../../EventListener";
import {TicketUpdateCollectionStarted} from "../../event/TicketUpdateCollectionStarted";
import EventBus from "../../../EventBus";
import TicketBoardIntegration, {UpdatedTicket} from "../../service/TicketBoardIntegration";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import {TicketUpdateCollectionFailed} from "../../event/TicketUpdateCollectionFailed";
import LogFactory from "../../../LogFactory";
import {UpdatedTicketsListFetched} from "../../event/UpdatedTicketsListFetched";

type UpdatedTicketsListCollectorEvent = TicketUpdateCollectionFailed | UpdatedTicketsListFetched;

export default class UpdatedTicketsListCollector implements EventListener<TicketUpdateCollectionStarted, null>{
    private readonly log = LogFactory.get(UpdatedTicketsListCollector.name);

    constructor(private readonly eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
    }

    onEvent(event: TicketUpdateCollectionStarted): Promise<boolean> {
        return this.fetchUpdatedTicketsList(event).run();
    }

    fetchUpdatedTicketsList(event: TicketUpdateCollectionStarted): T.Task<boolean> {
        return pipe(
            this.integration.getUpdatedTickets(event.ticketBoardKey, event.period),
            TE.fold<Error, UpdatedTicket[], UpdatedTicketsListCollectorEvent>(
                error => this.onFetchError(event, error),
                updatedTickets => this.onFetchSuccess(event, updatedTickets)
                ),
            T.chain(e => this.eventBus.publishEvent(e).getOrElse(false)) // this is an issue, if event is not published the process will hang
        )
    }

    onFetchError(event: TicketUpdateCollectionStarted, error: Error ):
        T.Task<TicketUpdateCollectionFailed> {
        // TODO log
        return T.task.of(new TicketUpdateCollectionFailed(
            event.aggregate,
            event.aggregateId,
            event.sequence + 1, // FIXME this is not right. You may get same sequence when 2 processors react on same event type. Aggregate should generate events
            event.devProjectId,
            event.ticketBoardKey,
            UpdatedTicketsListCollector.name,
            error.message)
        )
    }

    onFetchSuccess(event: TicketUpdateCollectionStarted, updatedTickets: UpdatedTicket[]):
        T.Task<UpdatedTicketsListFetched> {
        // TODO log
        return T.task.of(new UpdatedTicketsListFetched(
            event.aggregate,
            event.aggregateId,
            event.sequence + 1,
            event.devProjectId,
            event.ticketBoardKey,
            updatedTickets
        ))
    }

    // next processor:
    // for each updated ticket parse history and update tickets
    // after each is done check if collection completed
}
