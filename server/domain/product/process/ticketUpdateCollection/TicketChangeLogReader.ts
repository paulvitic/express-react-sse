import EventListener from "../../../EventListener";
import LogFactory from "../../../LogFactory";
import EventBus from "../../../EventBus";
import TicketBoardIntegration, {TicketChangeLog, UpdatedTicket} from "../../service/TicketBoardIntegration";
import {UpdatedTicketsListFetched} from "../../event/UpdatedTicketsListFetched";
import * as T from "fp-ts/lib/Task";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import {array} from "fp-ts/lib/Array";
import {TicketUpdateCollectionFailed} from "../../event/TicketUpdateCollectionFailed";
import {TicketChanged} from "../../event/TicketChanged";
import {Option} from "fp-ts/lib/Option";
import {TicketRemainedUnchanged} from "../../event/TicketRemainedUnchanged";

type TicketChangeLogEvent = TicketChanged | TicketRemainedUnchanged;
type UpdatedTicketChangeLogReaderEvent = TicketUpdateCollectionFailed | TicketChangeLogEvent;

export default class TicketChangeLogReader implements EventListener<UpdatedTicketsListFetched, null>{
    private readonly log = LogFactory.get(TicketChangeLogReader.name);

    constructor(private readonly eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {}

    onEvent(sourceEvent: UpdatedTicketsListFetched): Promise<null> | Promise<boolean> {
        return this.readUpdatedTicketsChangeLogs(sourceEvent).run();
    }

    private readUpdatedTicketsChangeLogs(sourceEvent: UpdatedTicketsListFetched): T.Task<boolean> {
        let res = array.map(sourceEvent.updatedTickets,
                updatedTicket => this.readTicketChangeLog(sourceEvent, updatedTicket));
        return T.of(false)
    }

    private readTicketChangeLog(sourceEvent: UpdatedTicketsListFetched, updatedTicket: UpdatedTicket) {
        return pipe(
            this.integration.readTicketChangeLog(updatedTicket.key, sourceEvent.period),
            TE.fold<Error, Option<TicketChangeLog>, UpdatedTicketChangeLogReaderEvent>(
            error => this.onReadError(sourceEvent, error),
            ticketChangeLog => this.onReadSuccess(sourceEvent, ticketChangeLog)),
            T.chain(e => this.eventBus.publishEvent(e).getOrElse(false))
        )
    }

    onReadError(sourceEvent: UpdatedTicketsListFetched, error: Error ):
        T.Task<TicketUpdateCollectionFailed> {
        return T.task.of(new TicketUpdateCollectionFailed(
            sourceEvent.aggregate,
            sourceEvent.aggregateId,
            sourceEvent.sequence + 1,
            sourceEvent.devProjectId,
            sourceEvent.ticketBoardKey,
            TicketChangeLogReader.name,
            error.message)
        )
    }

    onReadSuccess(sourceEvent: UpdatedTicketsListFetched, ticketChangeLog: Option<TicketChangeLog>):
        T.Task<TicketChangeLogEvent> {
        return T.task.of(ticketChangeLog.foldL(
            () => new TicketRemainedUnchanged(
                sourceEvent.aggregate,
                sourceEvent.aggregateId,
                sourceEvent.sequence + 1),
            () => new TicketChanged(
                sourceEvent.aggregate,
                sourceEvent.aggregateId,
                sourceEvent.sequence + 1))
        )
    }
}
