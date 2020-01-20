import EventStore from "../../domain/EventStore";
import DomainEvent  from "../../domain/DomainEvent";
import PostgresClient from "../clients/PostgresClient";
import LogFactory from "../context/LogFactory";
import {QueryConfig} from "pg";
import translateQueryResult from "./QueryResultTranslator";

export default class PostgresEventStore implements EventStore {
    private readonly log = LogFactory.get(PostgresEventStore.name);

    constructor(private readonly client: PostgresClient) {}

    logEvent = async (event: DomainEvent, published: boolean): Promise<boolean> => {
        // TODO add published flag
        const query = {
            text: 'INSERT INTO jira.event_log(aggregate_id, aggregate, event_type, generated_on, sequence, event) VALUES($1, $2, $3, $4, $5, $6) RETURNING event_type',
            values: [event.aggregateId, event.aggregate, event.eventType, event.generatedOn, event.sequence, JSON.stringify(event)],
        };

        return new Promise<boolean>((resolve) => {
            this.client.insert(query)
                .then((count) => {
                    if (count === 1) {
                        this.log.info(`Logged ${event.eventType}`);
                        resolve(true);
                    } else {
                        // TODO rollback
                        resolve(false);
                    }
                }).catch(()=> {
                resolve(false)
            })
        })
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
            let result = await this.client.read(query);
            let events = await translateQueryResult(result);
            return new Promise( (resolve) => {
                resolve(events);
            })
        } catch (e) {
            return new Promise( (resolve, reject) => {
                reject(e);
            })
        }
    };
}
