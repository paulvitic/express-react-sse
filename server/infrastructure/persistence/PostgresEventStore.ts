import EventStore from "../../domain/EventStore";
import DomainEvent  from "../../domain/DomainEvent";
import PostgresClient from "../clients/PostgresClient";
import {QueryResultRow} from "pg";
import * as translate from "./PostgresEventStoreTranslator";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

export default class PostgresEventStore implements EventStore {
    private readonly allEvents = 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 ORDER BY generated_on';
    private readonly eventsSince = 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 AND generated_on > $3 ORDER BY generated_on';

    constructor(private readonly client: PostgresClient) {}

    logEvent = (event: DomainEvent, published: boolean):
        TE.TaskEither<Error, boolean> => {
        return pipe(
            TE.fromEither(translate.toInsertQuery(event, published)),
            TE.chain(this.client.query),
            TE.map(this.assertLogAppended),
            TE.chain(TE.fromEither)
        );
    };

    eventsOfAggregate = async (aggregate: string, aggregateId: string): Promise<DomainEvent[]> => {
        return await this.queryEvents(this.allEvents, [aggregate, aggregateId]);
    };

    eventsOfAggregateSince = async (aggregate: string, aggregateId: string, since: Date): Promise<DomainEvent[]> => {
        return this.queryEvents(this.eventsSince, [aggregate, aggregateId, since]);
    };


    private queryEvents = async (query: string, args: any[]): Promise<DomainEvent[]> => {
        try {
            let result = await this.client.query(query, args);
            let events = await translate.toDomainEvents(result);
            return new Promise( (resolve) => {
                resolve(events);
            })
        } catch (e) {
            return new Promise( (resolve, reject) => {
                reject(e);
            })
        }
    };

    private assertLogAppended(result: QueryResultRow): E.Either<Error, boolean> {
        return E.tryCatch(() => {
                let {rows} = result;
                return rows.length === 1;
            }, reason => new Error(String(reason)))
    }
}
