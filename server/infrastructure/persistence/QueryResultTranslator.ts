import {QueryResult} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import {translateJsonObject} from "../JsonEventTranslator";
import TicketBoard from "../../domain/product/TicketBoard";
import {Option} from "fp-ts/lib/Option";
import {Either, tryCatch} from "fp-ts/lib/Either";

class TicketBoardValidationError extends Error {
    constructor(message) {
        super(message);
    }
}

export function translateToDomainEvents(res: QueryResult<any>): Promise<DomainEvent[]> {
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

export function translateTicketBoardQueryResult(res: QueryResult<any>): Promise<Option<TicketBoard>> {
    return new Promise<Option<TicketBoard>>(resolve => {

    })
}

export function translateToTicketBoard(result: QueryResult<any>): Either<TicketBoardValidationError, TicketBoard> {
    return tryCatch(() => {
            if (result.rows.length > 1) throw new Error("too many results");
            let [row] =  result.rows;
            return new TicketBoard(
                row.id,
                row.some_thing
            )},
            reason => new TicketBoardValidationError(reason))
}
