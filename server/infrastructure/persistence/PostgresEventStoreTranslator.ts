import {QueryResultRow} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import * as translate from "../JsonEventTranslator";

export const developmentProjectFields: string =
    "dp.id as dp_id, dp.active, dp.name, dp.started_on, dp.ticket_board_id, " +
    "tb.id as tb_id, tb.key, tb.external_ref";


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
