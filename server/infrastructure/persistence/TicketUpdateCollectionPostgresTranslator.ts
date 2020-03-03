import * as E from 'fp-ts/lib/Either'
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import {QueryResult, QueryResultRow} from "pg";
import TicketUpdate from "../../domain/product/TicketUpdate";
import {pipe} from "fp-ts/lib/pipeable";
import {array} from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import DevelopmentProject from "../../domain/product/DevelopmentProject";
import TicketBoard from "../../domain/product/TicketBoard";

export function toInsertCollectionQuery(collection: TicketUpdateCollection):
    E.Either<Error, string> {
    let query = `
        BEGIN;
        INSERT INTO ticket_update_collection(id, active, status, dev_project_id, from_day, to_day, started_at)
        VALUES ($ID, $ACTIVE, $STATUS, $DEV_PROJECT_ID, $FROM, $TO, $STARTED_AT)
        RETURNING *;
        `;
    return pipe(
        E.tryCatch(() => {
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
        INSERT INTO ticket_update(id, external_ref, key, collected, ticket_update_collection_id)
        VALUES ($ID, $EXTERNAL_REF, $KEY, $COLLECTED, $COLLECTION_ID)
        RETURNING *;
    `;
    return E.tryCatch(() => {
        insertQuery = insertQuery.replace(/\$ID/, `'${ticketUpdate.id}'`);
        insertQuery = insertQuery.replace(/\$EXTERNAL_REF/, `${ticketUpdate.externalRef}`);
        insertQuery = insertQuery.replace(/\$KEY/, `'${ticketUpdate.ticketKey}'`);
        insertQuery = insertQuery.replace(/\$COLLECTED/, `${ticketUpdate.collected}`);
        insertQuery = insertQuery.replace(/\$COLLECTION_ID/, `'${collectionId}'`);
        return query + insertQuery;
    }, err => err as Error)
}

export function fromCollectionInsertResult(results: QueryResultRow):
    E.Either<Error, TicketUpdateCollection> {
    return pipe(
        array.sequence(E.either)(array.map(results.splice(2), toTicketUpdate)),
        E.chain(ticketUpdates => {
            return E.tryCatch(() => {
                let collectionResult = results[1];
                let {rows} = collectionResult;
                let [row] = rows;
                return new TicketUpdateCollection(
                    row.id,
                    row.active,
                    row.dev_project_id,
                    row.status,
                    row.from_day,
                    row.to_day,
                    row.started_at,
                    row.ended_at,
                    ticketUpdates,
                    row.failed_at,
                    row.fail_reason
                )
            }, reason => reason as Error)
        })
    )
}

function toTicketUpdate(result: QueryResult):
    E.Either<Error, TicketUpdate> {
    return E.tryCatch(() => {
            let {rows} = result;
            let [row] = rows;
            return new TicketUpdate(
                row.id,
                row.external_ref,
                row.key,
                row.collected
            )},
        reason => reason as Error)
}

function toSqlDate(date: Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ')
}

