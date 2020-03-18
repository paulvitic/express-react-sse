import * as E from "fp-ts/lib/Either";
import {QueryResultRow} from "pg";
import * as O from "fp-ts/lib/Option";
import ProductDevelopment from "../../domain/product/ProductDevelopment";
import {pipe} from "fp-ts/lib/pipeable";
import TicketBoard from "../../domain/product/TicketBoard";

export function toFindByIdQuery(id: string): E.Either<Error, string> {
    let query = `
        SELECT * FROM jira.product_development AS pd 
        LEFT JOIN jira.ticket_board as tb ON tb.product_dev_fk = pd.product_dev_id  
        WHERE pd.product_dev_id=$ID;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$ID/, `'${id}'`);
        return query;
    }, err => err as Error)
}

export function toFindByTicketBoardKeyQuery(key: string): E.Either<Error, string> {
    let query = `
        SELECT * FROM jira.product_development AS pd
        LEFT JOIN jira.ticket_board as tb ON tb.product_dev_fk = pd.product_dev_id
        WHERE tb.ticket_board_key=$KEY;`;
    return E.tryCatch2v(() => {
        query = query.replace(/\$KEY/, `'${key}'`);
        return query;
    }, err => err as Error)
}

export function toInsertProductDevQuery(productDev: ProductDevelopment):
    E.Either<Error, string> {
    let query = `
        BEGIN;
        INSERT INTO jira.product_development(product_dev_id, active, name, started_on) 
        VALUES($ID, $ACTIVE, $NAME, $STARTED_ON) 
        RETURNING *;
        `;
    return pipe(
        E.tryCatch2v(() => {
            query = query.replace(/\$ID/, `'${productDev.id}'`);
            query = query.replace(/\$ACTIVE/, `${productDev.isActive}`);
            query = query.replace(/\$NAME/, `'${productDev.name}'`);
            query = query.replace(/\$STARTED_ON/, `'${toSqlDate(productDev.startedOn)}'`);
            return  query;
        }, err => err as Error),
        E.chain(query => O.fromNullable(productDev.ticketBoard).isSome() ?
            toInsertTicketBoardQuery(productDev.ticketBoard, productDev.id, query) :
            E.right(query)
        )
    )
}

function toInsertTicketBoardQuery(ticketBoard: TicketBoard, productDevId: string, query: string):
    E.Either<Error, string> {
    let insertQuery = `
        INSERT INTO jira.ticket_board(ticket_board_id, ticket_board_ref, ticket_board_key, product_dev_fk) 
        VALUES($ID, $EXTERNAL_REF, $KEY, $PRODUCT_DEV_FK) 
        RETURNING *;
    `;
    return E.tryCatch2v(() => {
        insertQuery = insertQuery.replace(/\$ID/, `'${ticketBoard.id}'`);
        insertQuery = insertQuery.replace(/\$EXTERNAL_REF/, `${ticketBoard.ref}`);
        insertQuery = insertQuery.replace(/\$KEY/, `'${ticketBoard.key}'`);
        insertQuery = insertQuery.replace(/\$PRODUCT_DEV_FK/, `'${productDevId}'`);
        return query + insertQuery;
    }, err => err as Error)
}

export function fromFindOptionalProductDevResult(results: QueryResultRow):
    E.Either<Error, O.Option<ProductDevelopment>> {
    let {rows} = results;
    return (rows as Array<any>).length===0 ?
        E.either.of(O.none) :
        fromQueryResultRows(rows[0]).fold(
            e => E.left(e),
            r => E.right(O.some(r)));
}

function fromQueryResultRows(row: any): E.Either<Error, ProductDevelopment> {
    return pipe(
        toTicketBoard(row),
        E.chain(ticketBoard => toCollection(row, ticketBoard))
    )
}

export function toTicketBoard(tb: any):
    E.Either<Error, TicketBoard> {
    return E.tryCatch2v(() => new TicketBoard(
        tb.ticket_board_id,
        tb.ticket_board_ref,
        tb.ticket_board_key,
        tb.product_dev_fk), err => err as Error)
}

function toCollection(pd: any, ticketBoard: TicketBoard) {
    return E.tryCatch2v( () => new ProductDevelopment(
        pd.product_dev_id,
        pd.active,
        pd.name,
        pd.started_on,
        ticketBoard), err => err as Error)
}

function toSqlDate(date: Date) {
    let tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19).replace('T', ' ');
    //return date.toISOString().slice(0, 19).replace('T', ' ')
}
