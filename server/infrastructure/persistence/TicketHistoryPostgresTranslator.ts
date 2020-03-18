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
            issue_type: stringValueOrNull(history.issueType),
            story_points: valueOrNull(history.storyPoints),
            started_at: dateValueOrNull(history.startedAt),
            ended_at: dateValueOrNull(history.endedAt),
            assignee: stringValueOrNull(history.assignee),
            duration: valueOrNull(history.duration),
            sprint_count: valueOrNull(history.sprintCount),
            status: stringValueOrNull(history.status),
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
        issueType: row.issue_type,
        storyPoints: row.story_points,
        startedAt: new Date(row.started_at),
        endedAt: row.ended_at === null ? null : new Date(row.ended_at),
        duration: row.duration,
        sprintCount: row.sprint_count,
        status: row.status,
        forChapter: row.for_chapter,
        chapter: row.chapter,
        assignee: row.assignee,
        forProductDev: row.for_product_dev
    }
}

export function toInsertQuery(history: TicketHistory): E.Either<Error, string> {
    return pipe(
        toRow(history),
        E.chain(row => E.tryCatch2v(() => {
            return `
             INSERT INTO ticket_history (latest, ticket_ref, ticket_key, issue_type, story_points, 
                                        status, assignee, 
                                        for_product_dev, for_chapter, chapter, sprint_count,
                                        started_at, ended_at, duration, 
                                        product_dev_fk)
                VALUES (${row.latest}, ${row.ticket_ref}, ${row.ticket_key}, ${row.issue_type}, ${row.story_points}, 
                        ${row.status}, ${row.assignee},
                        ${row.for_product_dev}, ${row.for_chapter}, ${row.chapter}, ${row.sprint_count},
                        ${row.started_at}, ${row.ended_at}, ${row.duration},
                        ${row.product_dev_fk});
             `;
        }, err => err as Error))
    )
}

export function toUpdateQuery(history: TicketHistory): E.Either<Error, string> {
    return pipe(
        toRow(history),
        E.chain(row => E.tryCatch2v(() => {
            return `
             UPDATE ticket_history 
                SET latest=${row.latest}, issue_type=${row.issue_type}, story_points=${row.story_points},
                    status=${row.status}, assignee=${row.assignee},
                    for_product_dev=${row.for_product_dev}, for_chapter=${row.for_chapter}, chapter=${row.chapter},
                    sprint_count=${row.sprint_count},
                    ended_at=${row.ended_at}, duration=${row.duration}     
                WHERE latest=true AND ticket_ref='${row.ticket_ref}';
                `;
        }, err => err as Error))
    )
}
