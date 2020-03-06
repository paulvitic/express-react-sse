import EventStore from "../../domain/EventStore";
import DomainEvent  from "../../domain/DomainEvent";
import PostgresClient from "../clients/PostgresClient";
import {QueryResultRow} from "pg";
import {translateToDomainEvents} from "./QueryResultTranslator";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import LogFactory from "../../domain/LogFactory";

export default class PostgresEventStore implements EventStore {
    private readonly log = LogFactory.get(PostgresEventStore.name);
    private readonly insert = 'INSERT INTO jira.event_log(aggregate_id, aggregate, event_type, generated_on, event) VALUES($1, $2, $3, $4, $5) returning event_type, aggregate, aggregate_id'
    private readonly allEvents = 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 ORDER BY generated_on';
    private readonly eventsSince = 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 AND generated_on > $3 ORDER BY generated_on';

    constructor(private readonly client: PostgresClient) {}

    logEvent = (event: DomainEvent, published: boolean):
        TE.TaskEither<Error, boolean> => {
        // TODO add published flag
        return pipe(
            this.client.query(this.insert,
                [event.aggregateId, event.aggregate, event.eventType, event.generatedOn, JSON.stringify(event)]),
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
            let events = await translateToDomainEvents(result);
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
