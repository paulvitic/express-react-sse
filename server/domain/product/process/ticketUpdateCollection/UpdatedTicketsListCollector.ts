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
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";

type UpdatedTicketsListCollectorEvent =
    TicketUpdateCollectionFailed |
    UpdatedTicketsListFetched;

export default class UpdatedTicketsListCollector extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(UpdatedTicketsListCollector.name);

    constructor(eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
        super(eventBus)
    }

    onEvent(sourceEvent: TicketUpdateCollectionStarted): Promise<E.Either<Error, void>> {
        this.log.info(`Processing event ${JSON.stringify(sourceEvent)}`);
        return new Promise<E.Either<Error,void>>(resolve => {
            pipe(
                TE.taskEither.of(this.fetchUpdatedTicketsList(sourceEvent)),
                TE.chain(event => TE.rightTask(event)),
                TE.chain(this.eventBus.publishEvent),
                TE.chain(published => published ?
                    TE.rightTask(T.task.of(null)):
                    TE.leftTask(T.task.of(new Error("event not published"))))
            ).run().then(res => resolve(res))
        })
    }

    fetchUpdatedTicketsList(sourceEvent: TicketUpdateCollectionStarted):
        T.Task<UpdatedTicketsListCollectorEvent> {
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
