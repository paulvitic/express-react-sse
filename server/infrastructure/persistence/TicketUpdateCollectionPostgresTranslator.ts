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

export function toFindByIdQuery(id: string): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection AS tuc
            LEFT JOIN ticket_update AS tu ON tuc.collection_id = tu.collection_fk
            WHERE tuc.collection_id=$ID;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$ID/, `'${id}'`);
        return query;
    }, err => err as Error)
}

export function toFindByStatusQuery(status: TicketUpdateCollectionStatus): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection AS tuc
            LEFT JOIN ticket_update AS tu ON tuc.collection_id = tu.collection_fk
            WHERE tuc.status=$STATUS;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[status]}'`);
        return query;
    }, err => err as Error)
}

export function toFindLatestIdByProjectQuery(productDevId: string): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection  
            WHERE product_dev_fk=$PROD_DEV_ID 
            ORDER BY started_at DESC
            LIMIT 1;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$PROD_DEV_ID/, `'${productDevId}'`);
        return query;
    }, err => err as Error)
}

export function toInsertCollectionQuery(collection: TicketUpdateCollection):
    E.Either<Error, string> {
    let query = `
        BEGIN;
            INSERT INTO ticket_update_collection(collection_id, active, status, product_dev_fk, ticket_board_key, from_day, to_day, started_at)
            VALUES ($ID, $ACTIVE, $STATUS, $PRODUCT_DEV_ID, $TICKET_BOARD_KEY, $FROM, $TO, $STARTED_AT);
        `;
    return pipe(
        E.tryCatch2v(() => {
            query = query.replace(/\$ID/, `'${collection.id}'`);
            query = query.replace(/\$ACTIVE/, `${collection.isActive}`);
            query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[collection.status]}'`);
            query = query.replace(/\$PRODUCT_DEV_ID/, `'${collection.productDevId}'`);
            query = query.replace(/\$TICKET_BOARD_KEY/, `'${collection.ticketBoardKey}'`);
            query = query.replace(/\$FROM/, `'${toSqlDate(collection.period.from)}'`);
            query = query.replace(/\$TO/, `'${toSqlDate(collection.period.to)}'`);
            query = query.replace(/\$STARTED_AT/, `'${toSqlDate(collection.startedAt)}'`);
            return  query;
        }, err => err as Error),
        E.chain(query => array.reduce(collection.ticketUpdates, E.either.of(query), (previous, current) => {
            return previous.fold( err => E.left(err), res => toInsertTicketUpdateQuery(current, collection.id, res))
        }))
    )
}

export function toUpdateCollectionQuery(id: string, collection: TicketUpdateCollection):
    E.Either<Error, string> {
    let query = `
        BEGIN;
        SELECT * FROM ticket_update_collection AS tuc 
            LEFT JOIN ticket_update AS tu ON tuc.collection_id = tu.collection_fk 
            WHERE tuc.collection_id=$ID FOR UPDATE OF tuc;
        UPDATE ticket_update_collection 
            SET status=$STATUS, ended_at=$ENDED_AT 
            WHERE collection_id=$ID;
        `;
    return pipe(
        E.tryCatch2v(() => {
            query = query.replace(/\$ID/, `'${id}'`);
            query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[collection.status]}'`);
            query = query.replace(/\$ENDED_AT/, collection.endedAt ? `'${toSqlDate(collection.endedAt)}'` : `NULL`);
            query = query.replace(/\$ID/, `'${id}'`);
            return  query;
        }, err => err as Error),
        E.chain(query => array.reduce(collection.domainEvents, E.either.of(query), (previous, current) => {
            return previous.fold(
                err => E.left(err),
                    res =>  appendToUpdateQuery(collection, current, res))
        }))
    )
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

function toDeleteTicketUpdateQuery(ticketUpdate: TicketUpdate, query: string):
    E.Either<Error, string> {
    let insertQuery = `
        DELETE FROM ticket_update WHERE ticket_update_id=$ID;
    `;
    return E.tryCatch2v(() => {
        insertQuery = insertQuery.replace(/\$ID/, `'${ticketUpdate.id}'`);
        return query + insertQuery;
    }, err => err as Error)
}

function toInsertTicketUpdateQuery(ticketUpdate: TicketUpdate, collectionId: string, query: string):
    E.Either<Error, string> {
    let insertQuery = `
        INSERT INTO ticket_update(ticket_update_id, ticket_ref, ticket_key, collected, collection_fk)
            VALUES ($ID, $EXTERNAL_REF, $KEY, $COLLECTED, $COLLECTION_FK);
    `;
    return E.tryCatch2v(() => {
        insertQuery = insertQuery.replace(/\$ID/, `'${ticketUpdate.id}'`);
        insertQuery = insertQuery.replace(/\$EXTERNAL_REF/, `${ticketUpdate.ref}`);
        insertQuery = insertQuery.replace(/\$KEY/, `'${ticketUpdate.key}'`);
        insertQuery = insertQuery.replace(/\$COLLECTED/, `${ticketUpdate.collected}`);
        insertQuery = insertQuery.replace(/\$COLLECTION_FK/, `'${collectionId}'`);
        return query + insertQuery;
    }, err => err as Error)
}

function toUpdateTicketUpdateQuery(ticketUpdate: TicketUpdate, query: string):
    E.Either<Error, string> {
    let updateQuery = `
        UPDATE ticket_update SET collected=$COLLECTED 
            WHERE ticket_update_id=$ID;
    `;
    return E.tryCatch2v(() => {
        updateQuery = updateQuery.replace(/\$ID/, `'${ticketUpdate.id}'`);
        updateQuery = updateQuery.replace(/\$COLLECTED/, `${ticketUpdate.collected}`);
        return query + updateQuery;
    }, err => err as Error)
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


function toSqlDate(date: Date): string {
    let tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19).replace('T', ' ');
}

