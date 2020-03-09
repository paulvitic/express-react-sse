import {QueryResultRow} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import * as translate from "../JsonEventTranslator";

class TicketBoardValidationError extends Error {
    constructor(message) {
        super(message);
    }
}

export function translateToDomainEvents(res: QueryResultRow): Promise<DomainEvent[]> {
    return new Promise<DomainEvent[]>((resolve, reject) => {
        const events = new Array<DomainEvent>();
        for (let row of res.rows){
            translate.fromJsoneObject(row.event).fold(
                err => reject(err),
                event => events.push(event)
            )
        }
        resolve(events);
    })
}
