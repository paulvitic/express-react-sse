import EventListener from "../../domain/EventListener";
import {TicketChanged} from "../../domain/product/event";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresClient from "../clients/PostgresClient";
import {ChangeLog, ChangelogFilter} from "../../domain/product/service/TicketBoardIntegration";
import PostgresRepository from "./PostgresRepository";
import LogFactory from "../../domain/LogFactory";
import {array} from "fp-ts/lib/Array";
import {TicketHistory} from "../../domain/product/TicketHistory";

function mapToHistory(row: any): TicketHistory {
    return {
        current: row.current,
        productDevId: row.product_dev_fk,
        ticketRef: row.ticket_ref,
        ticketKey: row.ticket_key,
        startedAt: new Date(row.started_at),
        endedAt: row.ended_at === null ? null : new Date(row.ended_at),
        duration: row.duration,
        sprint: row.sprint,
        sprintCount: row.sprint_count,
        status: row.status,
        issueType: row.issue_type,
        forChapter: row.for_chapter,
        chapter: row.chapter,
        assignee: row.assignee,
        forProductDev: row.for_product_dev
    }
}

function mapToRow(history: TicketHistory): any {
    return {
        current: valueOrNull(history.current),
        product_dev_fk: stringValueOrNull(history.productDevId),
        ticket_ref: valueOrNull(history.ticketRef),
        ticket_key: stringValueOrNull(history.ticketKey),
        started_at: dateValueOrNull(history.startedAt),
        ended_at: dateValueOrNull(history.endedAt),
        duration: valueOrNull(history.duration),
        sprint: stringValueOrNull(history.sprint),
        sprint_count: valueOrNull(history.sprintCount),
        status: stringValueOrNull(history.status),
        issue_type: stringValueOrNull(history.sprint),
        for_chapter: valueOrNull(history.forChapter),
        chapter: stringValueOrNull(history.chapter),
        assignee: stringValueOrNull(history.assignee),
        for_product_dev: valueOrNull(history.forProductDev)
    }
}

function stringValueOrNull(value: string): string {
    return value === null ? `NULL` : `'${value}'`;
}

function valueOrNull(value: boolean | number): string {
    return value === null ? `NULL` : `${value}`;
}

function dateValueOrNull(value: Date): string {
    return value === null ? `NULL` : `'${PostgresRepository.toSqlDate(value)}'`;
}

export class TicketHistoryPostgresProjection implements EventListener<TicketChanged> {
    private readonly log = LogFactory.get(TicketHistoryPostgresProjection.name);

    constructor(private readonly client: PostgresClient) {
    }

    onEvent(event: TicketChanged): Promise<E.Either<Error, boolean>> {
        return pipe(
            this.current(event.ticketRef),
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

    private current(ticketRef: number): TE.TaskEither<Error, O.Option<TicketHistory>> {
        let query = `
        SELECT * FROM ticket_history WHERE ticket_ref=${ticketRef} AND current=true;
        `;
        return pipe(
            this.client.query(query),
            TE.map(queryResult => O.fromNullable(queryResult.rows[0])),
            TE.map(row => row.foldL(
                () => O.none,
                row => O.some(mapToHistory(row)))
            ));
    }

    private insert(prodDevId: string, ticketRef: number, ticketKey: string): TE.TaskEither<Error, TicketHistory> {
        let query = `
        INSERT INTO ticket_history(current, product_dev_fk, ticket_ref, ticket_key, started_at) 
            VALUES (true, '${prodDevId}', ${ticketRef}, '${ticketKey}', '${PostgresRepository.toSqlDate(new Date())}')
            RETURNING *;
        `;
        return pipe(
            this.client.query(query),
            TE.map(queryResult => queryResult.rows[0]),
            TE.map(mapToHistory)
        );
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
        this.log.info(`${current.ticketKey}: status/${changeLog.type}: from: ${changeLog.from}:${changeLog.fromString}, to: ${changeLog.to}:${changeLog.toString}`);
        return pipe(
            TE.fromEither(pipe(
                this.toUpdateQuery(mapToRow({
                    ...current,
                    current: false,
                    endedAt: new Date(changeLog.timeStamp),
                    duration: current.startedAt.getTime() - new Date(changeLog.timeStamp).getTime(),
                    status: current.status === null ? changeLog.fromString : current.status
                }), "BEGIN;"),
                E.chain(query => this.toInsertQuery(mapToRow({
                    ...current,
                    current: true,
                    startedAt: new Date(changeLog.timeStamp),
                    status: changeLog.toString
                }), query)),
                E.chain(query => E.right(query + "COMMIT;")) // FIXME commit if first execution is correct or rollback;
            )),
            TE.chain(query => this.client.query(query)),
            TE.map(res => res.rows>0)
        )
    }

    private toInsertQuery(row: any, query: string): E.Either<Error, string> {
        return E.tryCatch2v(() => {
            let insertQuery = `
             INSERT INTO ticket_history (current, product_dev_fk, ticket_ref, ticket_key, 
                                         started_at, ended_at, duration, 
                                         sprint, sprint_count, status, issue_type, 
                                         for_chapter, chapter, assignee, for_product_dev)
                VALUES (${row.current}, ${row.product_dev_fk}, ${row.ticket_ref}, ${row.ticket_key}, 
                        ${row.started_at}, ${row.ended_at}, ${row.duration},
                        ${row.sprint}, ${row.sprint_count}, ${row.status}, ${row.issue_type}, 
                        ${row.for_chapter}, ${row.chapter}, ${row.assignee}, ${row.for_product_dev});
             `;
            return query + insertQuery;
        }, err => err as Error)
    }

    private toUpdateQuery(row: any, query: string): E.Either<Error, string> {
        return E.tryCatch2v(() => {
            let updateQuery = `
             UPDATE ticket_history 
                SET current=${row.current}, ticket_key=${row.ticket_key}, 
                    ended_at=${row.ended_at}, duration=${row.duration},
                    sprint=${row.sprint}, sprint_count=${row.sprint_count}, 
                    status=${row.status}, issue_type=${row.issue_type}, 
                    for_chapter=${row.for_chapter}, chapter=${row.chapter}, 
                    assignee=${row.assignee}, for_product_dev=${row.for_product_dev}
                WHERE current=true AND ticket_ref='${row.ticket_ref}';
                `;
            return query + updateQuery;
        }, err => err as Error)
    }
}
