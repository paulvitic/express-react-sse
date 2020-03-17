import EventListener from "../../domain/EventListener";
import {TicketChanged} from "../../domain/product/event";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresClient from "../clients/PostgresClient";
import {ChangeLog, ChangelogFilter} from "../../domain/product/service/TicketBoardIntegration";
import LogFactory from "../../domain/LogFactory";
import {array} from "fp-ts/lib/Array";
import {TicketHistory} from "../../domain/product/TicketHistory";
import * as translate from "./TicketHistoryPostgresTranslator";
import {TicketHistoryQueryService} from "../../domain/product/service/TicketHistoryQueryService";

export class TicketHistoryPostgresProjection implements EventListener<TicketChanged> {
    private readonly log = LogFactory.get(TicketHistoryPostgresProjection.name);
    constructor(private readonly client: PostgresClient,
                private readonly ticketHistory: TicketHistoryQueryService) {}

    onEvent(event: TicketChanged): Promise<E.Either<Error, boolean>> {
        return pipe(
            this.ticketHistory.findLatestByTicketRef(event.ticketRef),
            TE.chain(optionalCurrentHistory => optionalCurrentHistory.foldL(
                () => this.insert(event.prodDevId, event.ticketRef, event.ticketKey),
                history => TE.right2v(history))),
            TE.chain(history => array.reduce(event.changeLog, TE.taskEither.of(true), (previous, current) => {
                return previous.foldTaskEither(
                    err => TE.left2v(err),
                    () => this.handleChange(history, current))
            }))
        ).run();
    }

    private insert(productDevId: string, ticketRef: number, ticketKey: string): TE.TaskEither<Error, TicketHistory> {
        let history = {current: true, productDevId, ticketRef, ticketKey,
            startedAt: new Date(), endedAt: null, duration: null,
            sprint: null, sprintCount: null,
            status: null, issueType: null,
            forChapter: null, chapter: null,
            assignee: null, forProductDev: null
        };
        return pipe(
            TE.fromEither(translate.toInsertQuery(history, "BEGIN;")),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.client.rollBack(err),
                result => this.client.commit(result))),
            TE.chain(() => TE.right2v(history))
        )
    }

    private handleChange(current: TicketHistory, changeLog: ChangeLog):
        TE.TaskEither<Error, boolean> {
        switch (changeLog.type) {
            case ChangelogFilter.customfield_10010.type:
                this.log.info(`${current.ticketKey}: sprint/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.assignee.type:
                this.log.info(`${current.ticketKey}: assignee/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.issuetype.type:
                this.log.info(`${current.ticketKey}: issueType/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.status.type:
                return this.handleStatusChange(current, changeLog);
            case ChangelogFilter.labels.type:
                this.log.info(`${current.ticketKey}: labels/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.project.type:
                this.log.info(`${current.ticketKey}: project/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.Key.type:
                this.log.info(`${current.ticketKey}: key/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.customfield_10008.type:
                this.log.info(`${current.ticketKey}: epicLink/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            default:
                this.log.info(`${current.ticketKey}: default/${changeLog.type}, from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true)
        }
    }

    private handleStatusChange(current: TicketHistory, changeLog: ChangeLog): TE.TaskEither<Error, boolean> {
        this.log.info(`${current.ticketKey} ${changeLog.type} change: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
        let currentEntry = {
            ...current,
            current: false,
            endedAt: new Date(changeLog.timeStamp),
            duration: current.startedAt.getTime() - new Date(changeLog.timeStamp).getTime(),
            status: current.status === null ? changeLog.fromString : current.status
        };
        let newEntry = {
            ...current,
            current: true,
            startedAt: new Date(changeLog.timeStamp),
            status: changeLog.toString
        };
        return pipe(
            TE.fromEither(translate.toUpdateQuery(currentEntry, "BEGIN;")),
            TE.chain(query => TE.fromEither(translate.toInsertQuery(newEntry, query))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.client.rollBack(err),
                insertResult => this.client.commit(insertResult))),
            TE.map(insertResult => insertResult.length === 3)
        )
    }
}
