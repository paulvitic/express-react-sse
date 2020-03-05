import {QueryResultRow} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import {translateJsonObject} from "../JsonEventTranslator";
import TicketBoard from "../../domain/product/TicketBoard";
import * as O from "fp-ts/lib/Option";
import * as E from 'fp-ts/lib/Either'
import DevelopmentProject from "../../domain/product/DevelopmentProject";
import TicketUpdateCollection from "../../domain/product/TicketUpdateCollection";

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
                row.key,
                row.external_ref
            )},
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

export function translateToOptionalDevProject(result: QueryResultRow):
    E.Either<TicketBoardValidationError, O.Option<DevelopmentProject>> {
    return E.tryCatch(() => {
            let {rows} = result;
            if (rows.length === 0) return O.none;
            if (rows.length > 1) throw new Error("too many results");
            let [row] = rows;
            return O.some(new DevelopmentProject(
                row.dp_id,
                row.active,
                row.name,
                row.started_on,
                row.ticket_board_id ?
                    new TicketBoard(
                        row.ticket_board_id,
                        row.key,
                        row.external_ref) :
                    undefined
            ))},
        reason => reason as Error)
}
