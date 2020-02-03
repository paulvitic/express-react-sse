import {QueryResult, QueryResultRow} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import {translateJsonObject} from "../JsonEventTranslator";
import TicketBoard from "../../domain/product/TicketBoard";
import * as O from "fp-ts/lib/Option";
import * as E from 'fp-ts/lib/Either'

class TicketBoardValidationError extends Error {
    constructor(message) {
        super(message);
    }
}

export function translateToDomainEvents(res: QueryResultRow): Promise<DomainEvent[]> {
    return new Promise<DomainEvent[]>((resolve, reject) => {
        const events = new Array<DomainEvent>();
        for (let row of res.rows){
            translateJsonObject(row.event)
                .then(event => events.push(event))
                .catch(err => {
                    // TODO what to do?
                });
        }
        resolve(events);
    })
}

export function translateToTicketBoard(result: QueryResultRow):
    E.Either<TicketBoardValidationError, TicketBoard> {
    return E.tryCatch(() => {
            let {rows} = result;
            if (rows.length === 0 || rows.length > 1) throw new Error("none or too many results");
            let [row] = rows;
            return new TicketBoard(
                row.id,
                row.external_id,
                row.external_key
            )},
            reason => reason as Error)
}

export function translateToOptionalTicketBoard(result: QueryResultRow):
    E.Either<TicketBoardValidationError, O.Option<TicketBoard>> {
    return E.tryCatch(() => {
            let {rows} = result;
            if (rows.length === 0) return O.none;
            if (rows.length > 1) throw new Error("too many results");
            let [row] = rows;
            return O.some(new TicketBoard(
                row.id,
                row.external_id,
                row.external_key
            ))},
        reason => reason as Error)
}

export function assertDelete(result: QueryResultRow):
    E.Either<TicketBoardValidationError, boolean> {
    return E.tryCatch(() => {
        let {rows} = result;
        return rows.length === 1;
    },
        reason => reason as Error)
}
