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
        LEFT JOIN ticket_update as u ON u.collection_id = c.collection_id  
        WHERE c.collection_id=$ID;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$ID/, `'${id}'`);
        return query;
    }, err => err as Error)
}

export function toFindByStatusQuery(status: TicketUpdateCollectionStatus): E.Either<Error, string> {
    let query = `
        SELECT * FROM ticket_update_collection AS c 
        LEFT JOIN ticket_update as u ON u.collection_id = c.collection_id  
        WHERE status=$STATUS;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[status]}'`);
        return query;
    }, err => err as Error)
}

export function toInsertCollectionQuery(collection: TicketUpdateCollection):
    E.Either<Error, string> {
    let query = `
        BEGIN;
        INSERT INTO ticket_update_collection(collection_id, active, status, dev_project_id, from_day, to_day, started_at)
        VALUES ($ID, $ACTIVE, $STATUS, $DEV_PROJECT_ID, $FROM, $TO, $STARTED_AT)
        RETURNING *;
        `;
    return pipe(
        E.tryCatch2v(() => {
            query = query.replace(/\$ID/, `'${collection.id}'`);
            query = query.replace(/\$ACTIVE/, `${collection.isActive}`);
            query = query.replace(/\$STATUS/, `'${TicketUpdateCollectionStatus[collection.status]}'`);
            query = query.replace(/\$DEV_PROJECT_ID/, `'${collection.devProjectId}'`);
            query = query.replace(/\$FROM/, `'${toSqlDate(collection.period.from)}'`);
            query = query.replace(/\$TO/, `'${toSqlDate(collection.period.to)}'`);
            query = query.replace(/\$STARTED_AT/, `'${toSqlDate(collection.startedAt)}'`);
            return  query;
        }, err => err as Error),
        E.chain(query => array.reduce(collection.ticketUpdates, E.either.of(query),
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
        INSERT INTO ticket_update(ticket_update_id, external_ref, key, collected, collection_id)
        VALUES ($ID, $EXTERNAL_REF, $KEY, $COLLECTED, $COLLECTION_ID)
        RETURNING *;
    `;
    return E.tryCatch2v(() => {
        insertQuery = insertQuery.replace(/\$ID/, `'${ticketUpdate.id}'`);
        insertQuery = insertQuery.replace(/\$EXTERNAL_REF/, `${ticketUpdate.externalRef}`);
        insertQuery = insertQuery.replace(/\$KEY/, `'${ticketUpdate.ticketKey}'`);
        insertQuery = insertQuery.replace(/\$COLLECTED/, `${ticketUpdate.collected}`);
        insertQuery = insertQuery.replace(/\$COLLECTION_ID/, `'${collectionId}'`);
        return query + insertQuery;
    }, err => err as Error)
}

function toTicketUpdate(u: any):
    E.Either<Error, TicketUpdate> {
    return E.tryCatch2v(() => new TicketUpdate(
        u.ticket_update_id,
        u.external_ref,
        u.key,
        u.collected), err => err as Error)
}

function toCollection(c: any, ticketUpdates: TicketUpdate[]) {
    return E.tryCatch2v( () => new TicketUpdateCollection(
        c.collection_id,
        c.active,
        c.dev_project_id,
        c.status,
        c.from_day,
        c.to_day,
        c.started_at,
        c.ended_at,
        ticketUpdates,
        c.failed_at,
        c.fail_reason), err => err as Error)
}

function fromResult(rows: any[]): E.Either<Error, TicketUpdateCollection> {
    return pipe(
        array.sequence(E.either)((rows as Array<any>).map(u => toTicketUpdate(u))),
        E.chain(ticketUpdates => toCollection(rows[0], ticketUpdates))
    )
}

export function fromCollectionInsertResult(results: QueryResultRow):
    E.Either<Error, TicketUpdateCollection> {
    return pipe(
        array.sequence(E.either)(array.map(results.splice(2), toTicketUpdate)),
        E.chain(ticketUpdates => toCollection(results[1].rows[0], ticketUpdates))
    )
}

export function fromFindOptionalCollectionResult(results: QueryResultRow):
    E.Either<Error, O.Option<TicketUpdateCollection>> {
    let {rows} = results;
    return (rows as Array<any>).length===0 ?
        E.either.of(O.none) :
        fromResult(rows).fold(
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
        E.chain( groups => array.sequence(E.either)((groups as Array<any>).map(group => fromResult(group))))
    )
}


function toSqlDate(date: Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ')
}

