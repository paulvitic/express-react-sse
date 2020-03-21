import * as E from 'fp-ts/lib/Either'
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import {QueryResultRow} from "pg";
import TicketUpdate from "../../domain/product/TicketUpdate";
import {pipe} from "fp-ts/lib/pipeable";
import {array} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import DomainEvent from "../../domain/DomainEvent";
import {
    TicketChanged,
    TicketRemainedUnchanged,
    UpdatedTicketsListFetched
} from "../../domain/product/event";
import PostgresClient from "../clients/PostgresClient";

export function toFindByIdQuery(id: string): E.Either<Error, string> {
    return E.tryCatch2v(() => {
        return `
        SELECT * FROM jira.ticket_update_collection AS tuc
            LEFT JOIN jira.ticket_update AS tu ON tuc.collection_id = tu.collection_fk
            WHERE tuc.collection_id='${id}';
        `;
    }, err => err as Error)
}

export function toFindByStatusQuery(status: TicketUpdateCollectionStatus): E.Either<Error, string> {
    return E.tryCatch2v(() => {
        return `
        SELECT * FROM jira.ticket_update_collection AS tuc
            LEFT JOIN jira.ticket_update AS tu ON tuc.collection_id = tu.collection_fk
            WHERE tuc.status='${TicketUpdateCollectionStatus[status]}';
        `;
    }, err => err as Error)
}

export function toFindLatestByProjectQuery(productDevId: string): E.Either<Error, string> {

    return E.tryCatch2v(() => {
        return `
        SELECT * FROM jira.ticket_update_collection  
            WHERE product_dev_fk='${productDevId}' 
            ORDER BY started_at DESC
            LIMIT 1;`
            ;
    }, err => err as Error)
}

export function toInsertCollectionQuery(collection: TicketUpdateCollection):
    E.Either<Error, string> {
    return pipe(
        E.tryCatch2v(() => {
            let {id, isActive, status, productDevId, ticketBoardKey, period: {from, to}, startedAt} = collection;
            let begin = `BEGIN;`;
            let insertQuery = `
            INSERT INTO jira.ticket_update_collection(collection_id, active, status, product_dev_fk, ticket_board_key, 
                                                      from_day, to_day, started_at)
                VALUES ('${id}', ${isActive}, '${TicketUpdateCollectionStatus[status]}', '${productDevId}', '${ticketBoardKey}', 
                        '${PostgresClient.toSqlDate(from)}', '${PostgresClient.toSqlDate(to)}', '${PostgresClient.toSqlDate(startedAt)}');
            `;
            return  begin + insertQuery;
        }, err => err as Error),
        E.chain(query => array.reduce(collection.ticketUpdates, E.either.of(query), (previous, current) => {
            return previous.fold( err => E.left(err), res => toInsertTicketUpdateQuery(current, collection.id, res))
        }))
    )
}

export function toUpdateCollectionQuery(id: string, collection: TicketUpdateCollection):
    E.Either<Error, string> {
    return pipe(
        E.tryCatch2v(() => {
            let endedAt = collection.endedAt ? `'${PostgresClient.toSqlDate(collection.endedAt)}'` : `NULL`;
            let begin = `BEGIN;`;
            let updateQuery = `
            SELECT * FROM jira.ticket_update_collection AS tuc 
                LEFT JOIN jira.ticket_update AS tu ON tuc.collection_id = tu.collection_fk 
                WHERE tuc.collection_id='${id}' FOR UPDATE OF tuc;
            UPDATE jira.ticket_update_collection 
                SET status='${TicketUpdateCollectionStatus[collection.status]}', ended_at=${endedAt}  
                WHERE collection_id='${id}';
            `;
            return  begin + updateQuery;
        }, err => err as Error),
        E.chain(query => array.reduce(collection.domainEvents, E.either.of(query), (previous, current) => {
            return previous.fold(
                err => E.left(err),
                    res =>  appendToUpdateQuery(collection, current, res))
        }))
    )
}

// noinspection JSUnusedLocalSymbols
function toDeleteTicketUpdateQuery(ticketUpdate: TicketUpdate, query: string):
    E.Either<Error, string> {
    return E.tryCatch2v(() => {
        let deleteQuery = `
        DELETE FROM jira.ticket_update WHERE ticket_update_id='${ticketUpdate.id}';
        `;
        return query + deleteQuery;
    }, err => err as Error)
}

function toInsertTicketUpdateQuery(ticketUpdate: TicketUpdate, collectionId: string, query: string):
    E.Either<Error, string> {

    return E.tryCatch2v(() => {
        let insertQuery = `
        INSERT INTO jira.ticket_update(ticket_update_id, ticket_ref, ticket_key, collected, collection_fk)
            VALUES ('${ticketUpdate.id}', ${ticketUpdate.ref}, '${ticketUpdate.key}', ${ticketUpdate.collected}, '${collectionId}');
        `;
        return query + insertQuery;
    }, err => err as Error)
}

function toUpdateTicketUpdateQuery(ticketUpdate: TicketUpdate, query: string):
    E.Either<Error, string> {
    return E.tryCatch2v(() => {
        let updateQuery = `
        UPDATE jira.ticket_update SET collected=${ticketUpdate.collected} 
            WHERE ticket_update_id='${ticketUpdate.id}';
        `;
        return query + updateQuery;
    }, err => err as Error)
}

function appendToUpdateQuery(collection: TicketUpdateCollection, event:DomainEvent, query: string):
    E.Either<Error, string> {
    switch (event.eventType) {
        case UpdatedTicketsListFetched.name:
            return array.reduce(collection.ticketUpdates, E.either.of(query), (previous, current) => {
                return previous.fold(
                    err => E.left(err),
                    res => toInsertTicketUpdateQuery(current, collection.id, res))
            });
        case TicketChanged.name:
            return toUpdateTicketUpdateQuery(collection.ticketUpdateOfKey(
                (event as TicketChanged).ticketKey), query);
        case TicketRemainedUnchanged.name:
            return toUpdateTicketUpdateQuery(collection.ticketUpdateOfKey(
                (event as TicketRemainedUnchanged).ticketKey), query);
        default:
            return E.right(query);
    }
}


function toTicketUpdate(u: any):
    E.Either<Error, TicketUpdate> {
    return E.tryCatch2v(() => {
        return new TicketUpdate (
                u.ticket_update_id,
                u.ticket_ref,
                u.ticket_key,
                u.collected)
    }, err => err as Error)
}

function toCollection(c: any, ticketUpdates: TicketUpdate[]):
    E.Either<Error, TicketUpdateCollection>  {
    return E.tryCatch2v( () => {
        return new TicketUpdateCollection(
            c.collection_id,
            c.active,
            TicketUpdateCollectionStatus[(c.status as string)],
            c.product_dev_fk,
            c.ticket_board_key,
            c.from_day,
            c.to_day,
            c.started_at,
            c.ended_at,
            ticketUpdates)
    }, err => err as Error)
}

export function fromQueryResultRows(rows: any[]): E.Either<Error, TicketUpdateCollection> {
    return pipe(
        array.sequence(E.either)(rows.map(row =>  toTicketUpdate(row))).fold(() => E.right(null), r => E.right(r)),
        E.chain(ticketUpdates => toCollection(rows[0], ticketUpdates))
    )
}

export function fromFindOptionalCollectionResult(results: QueryResultRow):
    E.Either<Error, O.Option<TicketUpdateCollection>> {
    let {rows} = results;
    return rows.length===0 ?
        E.either.of(O.none) :
        fromQueryResultRows(rows).fold(
            e => E.left(e),
            r => E.right(O.some(r)));
}

export function fromFindCollectionsResult(results: QueryResultRow):
    E.Either<Error, TicketUpdateCollection[]> {
    let {rows} = results;
    return pipe(
        E.tryCatch2v(() => {
            let groupedRows: Map<string, any[]> = rows.reduce(groupRows, new Map<string, any[]>());
            return Array.from(groupedRows.values());
        }, err => err as Error),
        E.chain( groupedRows => array.sequence(E.either)((groupedRows as Array<any>).map(rows => fromQueryResultRows(rows))))
    )
}

function groupRows(map: Map<string, any[]>, row: any) {
    if (!map.get(row.collection_id)) map.set(row.collection_id, []);
    map.get(row.collection_id).push(row);
    return map;
}

