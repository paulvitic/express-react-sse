import EventStore from "../../domain/EventStore";
import DomainEvent  from "../../domain/DomainEvent";
import PostgresClient from "../clients/PostgresClient";
import LogFactory from "../context/LogFactory";
import {QueryConfig, QueryResultRow} from "pg";
import {translateToDomainEvents, translateToOptionalTicketBoard} from "./QueryResultTranslator";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";

export default class PostgresEventStore implements EventStore {
    private readonly log = LogFactory.get(PostgresEventStore.name);

    constructor(private readonly client: PostgresClient) {}

    logEvent = (event: DomainEvent, published: boolean):
        TE.TaskEither<Error, boolean> => {
        // TODO add published flag
        const query = {
            text: 'INSERT INTO jira.event_log(aggregate_id, aggregate, event_type, generated_on, sequence, event) VALUES($1, $2, $3, $4, $5, $6) returning event_type, aggregate, aggregate_id',
            values: [event.aggregateId, event.aggregate, event.eventType, event.generatedOn, event.sequence, JSON.stringify(event)],
        };

        return pipe(
            this.client.executeQuery(query),
            TE.map(this.assertLogAppended),
            TE.chain(TE.fromEither)
        );
    };


    eventsOfAggregate = async (aggregate: string, aggregateId: string): Promise<DomainEvent[]> => {
        const query = {
            text: 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 ORDER BY (sequence ,generated_on)',
            values: [aggregate, aggregateId],
        };
        return await this.queryEvents(query);
    };


    eventsOfAggregateSince = async (aggregate: string, aggregateId: string, since: number): Promise<DomainEvent[]> => {
        const query = {
            text: 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 AND sequence > $3 ORDER BY (sequence ,generated_on)',
            values: [aggregate, aggregateId, since],
        };
        return this.queryEvents(query);
    };


    private queryEvents = async (query: QueryConfig): Promise<DomainEvent[]> => {
        try {
            let result = await this.client.execute(query);
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
            },
            reason => new Error(String(reason)))
    }
}
