import * as E from 'fp-ts/lib/Either'
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import {QueryResultRow} from "pg";
import TicketUpdate from "../../domain/product/TicketUpdate";
import {pipe} from "fp-ts/lib/pipeable";
import {array} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";

export function toFindByIdQuery(id: string): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection AS c 
        LEFT JOIN ticket_update as u ON c.collection_id = u.collection_id  
        WHERE c.collection_id=$ID;`;

    return E.tryCatch2v(() => {
        query = query.replace(/\$ID/, `'${id}'`);
        return query;
    }, err => err as Error)
}

export function toFindByStatusQuery(status: TicketUpdateCollectionStatus): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection AS tuc 
        LEFT JOIN ticket_update as tu ON tu.collection_id = tuc.collection_id  
        WHERE tuc.status=$STATUS;`;

    return E.tryCatch2v(() => {
        query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[status]}'`);
        return query;
    }, err => err as Error)
}

export function toFindLatestByProjectQuery(productDevId: string): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection AS tuc 
        LEFT JOIN ticket_update as tu ON tu.collection_id = tuc.collection_id  
        WHERE tuc.product_dev_id=$PROD_DEV_ID 
        ORDER BY tuc.started_at DESC 
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
        INSERT INTO ticket_update_collection(collection_id, active, status, product_dev_id, from_day, to_day, started_at)
        VALUES ($ID, $ACTIVE, $STATUS, $PRODUCT_DEV_ID, $FROM, $TO, $STARTED_AT);
        `;

    return pipe(
        E.tryCatch2v(() => {
            query = query.replace(/\$ID/, `'${collection.id}'`);
            query = query.replace(/\$ACTIVE/, `${collection.isActive}`);
            query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[collection.status]}'`);
            query = query.replace(/\$PRODUCT_DEV_ID/, `'${collection.productDevId}'`);
            query = query.replace(/\$FROM/, `'${toSqlDate(collection.period.from)}'`);
            query = query.replace(/\$TO/, `'${toSqlDate(collection.period.to)}'`);
            query = query.replace(/\$STARTED_AT/, `'${toSqlDate(collection.startedAt)}'`);
            return  query;
        }, err => err as Error),

        E.chain(query => array.reduce(
            collection.ticketUpdates,
            E.either.of(query),
            (previous, current) => {
                return previous.isRight() ?
                    toInsertTicketUpdateQuery(current, collection.id, previous.value) :
                    E.left(previous.value)
            }))
    )
}

function toInsertTicketUpdateQuery(ticketUpdate: TicketUpdate, collectionId: string, query: string):
    E.Either<Error, string> {
    let insertQuery = `
        INSERT INTO ticket_update(ticket_update_id, ticket_ref, ticket_key, collected, collection_id)
        VALUES ($ID, $EXTERNAL_REF, $KEY, $COLLECTED, $COLLECTION_ID);
    `;

    return E.tryCatch2v(() => {
        if (ticketUpdate === undefined || null) return query;
        insertQuery = insertQuery.replace(/\$ID/, `'${ticketUpdate.id}'`);
        insertQuery = insertQuery.replace(/\$EXTERNAL_REF/, `${ticketUpdate.ref}`);
        insertQuery = insertQuery.replace(/\$KEY/, `'${ticketUpdate.key}'`);
        insertQuery = insertQuery.replace(/\$COLLECTED/, `${ticketUpdate.collected}`);
        insertQuery = insertQuery.replace(/\$COLLECTION_ID/, `'${collectionId}'`);
        return query + insertQuery;
    }, err => err as Error)
}

function toTicketUpdate(u: any):
    E.Either<Error, TicketUpdate> {
    return E.tryCatch2v(() => {
        //let [u] = result.rows;
        return new TicketUpdate(
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
            c.product_dev_id,
            c.status,
            c.from_day,
            c.to_day,
            c.started_at,
            c.ended_at,
            ticketUpdates,
            c.failed_at,
            c.fail_reason)
    }, err => err as Error)
}

function fromQueryResultRows(rows: any[]): E.Either<Error, TicketUpdateCollection> {
    return pipe(
        array.sequence(E.either)(array.map(rows, row => toTicketUpdate(row))),
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
            let groupedRows: Map<string, any[]> = rows.reduce(function (map: Map<string, any[]>, row: any) {
                if (!map.get(row.collection_id)) map.set(row.collection_id, []);
                map.get(row.collection_id).push(row);
                return map;
            }, new Map<string, any[]>());
            return Array.from(groupedRows.values());
        }, err => err as Error),
        E.chain( groupedRows =>
            array.sequence(E.either)((groupedRows as Array<any>).map(rows => fromQueryResultRows(rows))))
    )
}


function toSqlDate(date: Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ')
}

