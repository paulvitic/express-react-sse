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
        this.log.info(`Processing ${TicketUpdateCollectionStarted.name} event`);
        return this.fetchUpdatedTicketsList(event).run();
    }

    fetchUpdatedTicketsList(sourceEvent: TicketUpdateCollectionStarted): T.Task<boolean> {
        return pipe(
            this.integration.getUpdatedTickets(sourceEvent.ticketBoardKey, sourceEvent.period),
            TE.fold<Error, UpdatedTicket[], UpdatedTicketsListCollectorEvent>(
                error => this.onFetchError(sourceEvent, error),
                updatedTickets => this.onFetchSuccess(sourceEvent, updatedTickets)
                ),
            T.chain(e => this.eventBus.publishEvent(e).getOrElse(false)) // this is an issue, if event is not published the process will hang
        )
    }

    onFetchError(sourceEvent: TicketUpdateCollectionStarted, error: Error ):
        T.Task<TicketUpdateCollectionFailed> {
        return T.task.of(new TicketUpdateCollectionFailed(
            sourceEvent.aggregate,
            sourceEvent.aggregateId,
            sourceEvent.sequence + 1,
            sourceEvent.devProjectId,
            sourceEvent.ticketBoardKey,
            UpdatedTicketsListCollector.name,
            error.message)
        )
    }

    onFetchSuccess(sourceEvent: TicketUpdateCollectionStarted, updatedTickets: UpdatedTicket[]):
        T.Task<UpdatedTicketsListFetched> {
        return T.task.of(new UpdatedTicketsListFetched(
            sourceEvent.aggregate,
            sourceEvent.aggregateId,
            sourceEvent.sequence + 1,
            sourceEvent.devProjectId,
            sourceEvent.ticketBoardKey,
            sourceEvent.period,
            updatedTickets
        ))
    }
}
