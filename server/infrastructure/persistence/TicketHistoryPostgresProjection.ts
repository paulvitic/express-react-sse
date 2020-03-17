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
                () => this.insertFirstEntry(event),
                history => TE.right2v(history))),
            TE.chain(history => array.reduce(event.changeLog, TE.taskEither.of(true), (previous, current) => {
                return previous.foldTaskEither(
                    err => TE.left2v(err),
                    () => this.handleChange(history, current))
            }))
        ).run();
    }

    private insertFirstEntry(event: TicketChanged):
        TE.TaskEither<Error, TicketHistory> {
        let {prodDevId, ticketRef, ticketKey, prodDevStartedOn} = event;
        let history: TicketHistory = {
            latest: true,
            prodDevId,
            ticketRef,
            ticketKey,
            startedAt: new Date(prodDevStartedOn),
            endedAt: null,
            assignee: null,
            status: null,
            duration: null,
            forProductDev: null,
            chapter: null,
            forChapter: null,
            sprintCount: null,
            sprint: null,
            issueType: null
        };
        return pipe(
            TE.fromEither(translate.toInsertQuery(history, "BEGIN;")),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.client.rollBack(err),
                result => this.client.commit(result))),
            TE.chain(() => TE.right2v(history))
        )
    }

    private handleChange(history: TicketHistory, changeLog: ChangeLog):
        TE.TaskEither<Error, boolean> {
        switch (changeLog.type) {
            case ChangelogFilter.customfield_10010.type:
                this.log.info(`${history.ticketKey}: sprint/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.assignee.type:
                return this.handleAssigneeChange(history, changeLog);
            case ChangelogFilter.issuetype.type:
                this.log.info(`${history.ticketKey}: issueType/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.status.type:
                return this.handleStatusChange(history, changeLog);
            case ChangelogFilter.labels.type:
                this.log.info(`${history.ticketKey}: labels/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.project.type:
                this.log.info(`${history.ticketKey}: project/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.Key.type:
                this.log.info(`${history.ticketKey}: key/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            case ChangelogFilter.customfield_10008.type:
                this.log.info(`${history.ticketKey}: epicLink/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true);
            default:
                this.log.info(`${history.ticketKey}: default/${changeLog.type}, from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
                return TE.taskEither.of(true)
        }
    }

    private handleStatusChange(history: TicketHistory, changeLog: ChangeLog): TE.TaskEither<Error, boolean> {
        this.log.debug(`${history.ticketKey} ${changeLog.type} change: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
        return pipe(
            TE.fromEither(
                E.tryCatch2v(() => {
                    let currentEntry = {
                        ...history,
                        latest: false,
                        endedAt: new Date(changeLog.timeStamp),
                        duration: new Date(changeLog.timeStamp).getTime() - history.startedAt.getTime(),
                        status: history.status === null ? changeLog.fromString : history.status
                    };
                    let newEntry = {
                        ...history,
                        latest: true,
                        startedAt: new Date(changeLog.timeStamp),
                        status: changeLog.toString
                    };
                    return {currentEntry, newEntry}
                }, err => err as Error)),
            TE.chain(entries => this.updateCurrentAndInsertNew(entries.currentEntry, entries.newEntry))
        )
    }

    private handleAssigneeChange(history: TicketHistory, changeLog: ChangeLog): TE.TaskEither<Error, boolean> {
        this.log.debug(`${history.ticketKey}: assignee/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
        return pipe(
            TE.fromEither(
                E.tryCatch2v(() => {
                    let currentEntry = {
                        ...history,
                        latest: false,
                        endedAt: new Date(changeLog.timeStamp),
                        duration: new Date(changeLog.timeStamp).getTime() - history.startedAt.getTime(),
                        assignee: history.assignee === null ? changeLog.fromString : history.assignee
                    };
                    let newEntry = {
                        ...history,
                        latest: true,
                        startedAt: new Date(changeLog.timeStamp),
                        assignee: changeLog.toString
                    };
                    return {currentEntry, newEntry}
                }, err => err as Error)),
            TE.chain(entries => this.updateCurrentAndInsertNew(entries.currentEntry, entries.newEntry))
        );
    }

    private updateCurrentAndInsertNew(currentEntry: TicketHistory, newEntry: TicketHistory):
        TE.TaskEither<Error, boolean> {
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
