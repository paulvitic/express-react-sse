import {QueryResult} from "pg";
import DomainEvent from "../../domain/DomainEvent";
import {translateJsonObject} from "../JsonEventTranslator";

export default function translateQueryResult(res: QueryResult<any>): Promise<DomainEvent[]> {
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
