import EventListener from "../../../EventListener";
import EventBus from "../../../EventBus";
import TicketBoardIntegration, {UpdatedTicket} from "../../service/TicketBoardIntegration";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import {
    TicketUpdateCollectionFailed,
    UpdatedTicketsListFetched,
    TicketUpdateCollectionStarted} from "../../event";
import LogFactory from "../../../LogFactory";

type UpdatedTicketsListCollectorEvent = TicketUpdateCollectionFailed | UpdatedTicketsListFetched;

export default class UpdatedTicketsListCollector implements EventListener<TicketUpdateCollectionStarted>{
    private readonly log = LogFactory.get(UpdatedTicketsListCollector.name);

    constructor(private readonly eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
    }

    async onEvent(sourceEvent: TicketUpdateCollectionStarted): Promise<E.Either<Error, void>> {
        this.log.info(`Processing ${TicketUpdateCollectionStarted.name} event`);
        let event = await this.fetchUpdatedTicketsList(sourceEvent).run();
        let published = await this.eventBus.publishEvent(event).run();
        return published.isRight() && published.value ? E.right(null) : E.left(new Error("event not published"));
    }

    fetchUpdatedTicketsList(sourceEvent: TicketUpdateCollectionStarted): T.Task<UpdatedTicketsListCollectorEvent> {
        return pipe(
            this.integration.getUpdatedTickets(sourceEvent.ticketBoardKey, sourceEvent.period),
            TE.fold<Error, UpdatedTicket[], UpdatedTicketsListCollectorEvent>(
                error => this.onFetchError(sourceEvent, error),
                updatedTickets => this.onFetchSuccess(sourceEvent, updatedTickets)
            )
        )
    }

    onFetchError(sourceEvent: TicketUpdateCollectionStarted, error: Error ):
        T.Task<TicketUpdateCollectionFailed> {
        return T.task.of(new TicketUpdateCollectionFailed(
            sourceEvent.aggregate,
            sourceEvent.aggregateId,
            sourceEvent.prodDevId,
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
            sourceEvent.prodDevId,
            sourceEvent.ticketBoardKey,
            sourceEvent.period,
            updatedTickets
        ))
    }
}
