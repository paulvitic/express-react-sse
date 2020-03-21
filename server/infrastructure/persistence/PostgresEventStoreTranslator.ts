import {QueryResultRow} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import * as translate from "../JsonEventTranslator";
import * as E from "fp-ts/lib/Either";
import PostgresClient from "../clients/PostgresClient";

class TicketBoardValidationError extends Error {
    constructor(message) {
        super(message);
    }
}

export function toInsertQuery(event: DomainEvent, published: boolean): E.Either<Error, string> {
    return E.tryCatch2v(() => {
        let {aggregateId, aggregate, eventType, generatedOn} = event;
        return `
        INSERT INTO jira.event_log(aggregate_id, aggregate, event_type, generated_on, published, event) 
            VALUES('${aggregateId}', '${aggregate}', '${eventType}', '${PostgresClient.toSqlDate(generatedOn)}', 
                   ${published}, '${JSON.stringify(event)}') 
            RETURNING event_type, aggregate, aggregate_id;
        `;
    }, err => err as Error)
}



export function toDomainEvents(res: QueryResultRow): Promise<DomainEvent[]> {
    return new Promise<DomainEvent[]>((resolve, reject) => {
        const events = new Array<DomainEvent>();
        for (let row of res.rows){
            translate.fromJsonObject(row.event).fold(
                err => reject(err),
                event => events.push(event)
            )
        }
        resolve(events);
    })
}
