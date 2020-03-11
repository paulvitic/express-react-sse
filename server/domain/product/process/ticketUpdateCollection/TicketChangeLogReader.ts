import LogFactory from "../../../LogFactory";
import EventBus from "../../../EventBus";
import TicketBoardIntegration, {TicketChangeLog, UpdatedTicket} from "../../service/TicketBoardIntegration";
import {
    UpdatedTicketsListFetched,
    TicketUpdateCollectionFailed,
    TicketChanged,
    TicketRemainedUnchanged } from "../../event";
import * as T from "fp-ts/lib/Task";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {array} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import {TicketUpdateCollectionProcess} from "./TicketUpdateCollectionProcess";

export type TicketChangeLogEvent = TicketChanged | TicketRemainedUnchanged;
type UpdatedTicketChangeLogReaderEvent = TicketUpdateCollectionFailed | TicketChangeLogEvent;

export default class TicketChangeLogReader extends TicketUpdateCollectionProcess {
    private readonly log = LogFactory.get(TicketChangeLogReader.name);

    constructor(eventBus: EventBus,
                private readonly integration: TicketBoardIntegration) {
        super(eventBus)
    }

    async onEvent(sourceEvent: UpdatedTicketsListFetched): Promise<E.Either<Error, void>> {
        this.log.info(`Processing ${UpdatedTicketsListFetched.name} event`);
        let events = await this.readUpdatedTicketsChangeLogs(sourceEvent).run();
        let allPublished = array.map(events,async (event) => {
            let published =  await this.eventBus.publishEvent(event).run();
            return published.isRight() && published.value ? E.right(null) : E.left(new Error("event not published"));
        });
        return array.reduce(await Promise.all(allPublished) as E.Either<Error, void>[],
            E.right<Error, void>(null),
            (previous, current) => {return previous.chain(() => current)});
    }

    private readUpdatedTicketsChangeLogs(sourceEvent: UpdatedTicketsListFetched):
        T.Task<UpdatedTicketChangeLogReaderEvent[]> {
        return array.traverseWithIndex(T.task)(
            sourceEvent.updatedTickets,(index, updatedTicket) =>
                this.readTicketChangeLog(sourceEvent, updatedTicket, index + 1));
    }

    private readTicketChangeLog(sourceEvent: UpdatedTicketsListFetched, updatedTicket: UpdatedTicket, index: number):
        T.Task<UpdatedTicketChangeLogReaderEvent>{
        return pipe(
            this.integration.readTicketChangeLog(updatedTicket.key, new Date(sourceEvent.fromDate), new Date(sourceEvent.toDate)),
            TE.fold<Error, O.Option<TicketChangeLog>, UpdatedTicketChangeLogReaderEvent>(
            error => this.onReadError(sourceEvent, error, index),
            ticketChangeLog => this.onReadSuccess(sourceEvent, updatedTicket.id, updatedTicket.key, ticketChangeLog, index))
        )
    }

    onReadError(sourceEvent: UpdatedTicketsListFetched, error: Error, index: number):
        T.Task<TicketUpdateCollectionFailed> {
        return T.task.of(new TicketUpdateCollectionFailed(
            sourceEvent.aggregate,
            sourceEvent.aggregateId,
            sourceEvent.prodDevId,
            sourceEvent.ticketBoardKey,
            TicketChangeLogReader.name,
            error.message)
        )
    }

    onReadSuccess(sourceEvent: UpdatedTicketsListFetched,
                  updatedTicketId: number,
                  updatedTicketKey: string,
                  ticketChangeLog: O.Option<TicketChangeLog>,
                  index: number):
        T.Task<TicketChangeLogEvent> {
        return T.task.of(ticketChangeLog.foldL(
            () => new TicketRemainedUnchanged(
                sourceEvent.aggregate,
                sourceEvent.aggregateId,
                sourceEvent.prodDevId,
                updatedTicketId,
                updatedTicketKey),
            ticket => new TicketChanged(
                sourceEvent.aggregate,
                sourceEvent.aggregateId,
                sourceEvent.prodDevId,
                ticket.id,
                ticket.key,
                ticket.changeLog)
            )
        )
    }
}
