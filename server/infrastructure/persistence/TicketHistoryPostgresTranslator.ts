import {TicketHistory} from "../../domain/product/TicketHistory";
import * as E from "fp-ts/lib/Either";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresClient from "../clients/PostgresClient";

function stringValueOrNull(value: string): string {
    return value === null ? `NULL` : `'${value}'`;
}

function valueOrNull(value: boolean | number): string {
    return value === null ? `NULL` : `${value}`;
}

function dateValueOrNull(value: Date): string {
    return value === null ? `NULL` : `'${PostgresClient.toSqlDate(value)}'`;
}

function toRow(history: TicketHistory): E.Either<Error, any> {
    return E.tryCatch2v(() => {
        return {
            latest: valueOrNull(history.latest),
            product_dev_fk: stringValueOrNull(history.prodDevId),
            ticket_ref: valueOrNull(history.ticketRef),
            ticket_key: stringValueOrNull(history.ticketKey),
            started_at: dateValueOrNull(history.startedAt),
            ended_at: dateValueOrNull(history.endedAt),
            assignee: stringValueOrNull(history.assignee),
            duration: valueOrNull(history.duration),
            sprint: stringValueOrNull(history.sprint),
            sprint_count: valueOrNull(history.sprintCount),
            status: stringValueOrNull(history.status),
            issue_type: stringValueOrNull(history.sprint),
            for_chapter: valueOrNull(history.forChapter),
            chapter: stringValueOrNull(history.chapter),
            for_product_dev: valueOrNull(history.forProductDev)
        };
    }, err => err as Error)
}

export function toHistory(row: any): TicketHistory {
    return {
        latest: row.latest,
        prodDevId: row.product_dev_fk,
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

export function toInsertQuery(history: TicketHistory, query: string): E.Either<Error, string> {
    return pipe(
        toRow(history),
        E.chain(row => E.tryCatch2v(() => {
            let insertQuery = `
             INSERT INTO ticket_history (latest, product_dev_fk, ticket_ref, ticket_key, 
                                         started_at, ended_at, duration, 
                                         sprint, sprint_count, status, issue_type, 
                                         for_chapter, chapter, assignee, for_product_dev)
                VALUES (${row.latest}, ${row.product_dev_fk}, ${row.ticket_ref}, ${row.ticket_key}, 
                        ${row.started_at}, ${row.ended_at}, ${row.duration},
                        ${row.sprint}, ${row.sprint_count}, ${row.status}, ${row.issue_type}, 
                        ${row.for_chapter}, ${row.chapter}, ${row.assignee}, ${row.for_product_dev});
             `;
            return query + insertQuery;
        }, err => err as Error))
    )
}

export function toUpdateQuery(history: TicketHistory, query: string): E.Either<Error, string> {
    return pipe(
        toRow(history),
        E.chain(row => E.tryCatch2v(() => {
            let updateQuery = `
             UPDATE ticket_history 
                SET latest=${row.latest}, ticket_key=${row.ticket_key}, 
                    ended_at=${row.ended_at}, duration=${row.duration},
                    sprint=${row.sprint}, sprint_count=${row.sprint_count}, 
                    status=${row.status}, issue_type=${row.issue_type}, 
                    for_chapter=${row.for_chapter}, chapter=${row.chapter}, 
                    assignee=${row.assignee}, for_product_dev=${row.for_product_dev}
                WHERE latest=true AND ticket_ref='${row.ticket_ref}';
                `;
            return query + updateQuery;
        }, err => err as Error))
    )
}
