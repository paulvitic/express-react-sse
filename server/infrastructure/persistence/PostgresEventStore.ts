import EventStore from "../../domain/EventStore";
import DomainEvent, {EventRegistry} from "../../domain/DomainEvent";
import PostgresClient from "../context/PostgresClient";
import LogFactory from "../context/LogFactory";

export default class PostgresEventStore implements EventStore {
    private readonly log = LogFactory.get(PostgresEventStore.name);

    constructor(private readonly client: PostgresClient) {}

    eventsOfAggregate = async (aggregate: string, aggregateId: string): Promise<DomainEvent[]> => {
        const query = {
            text: 'SELECT event FROM jira.event_log WHERE aggregate=$1 AND aggregate_id=$2 ORDER BY generated_on',
            values: [aggregate, aggregateId],
        };

        return new Promise((resolve) => {
            const events = new Array<DomainEvent>();
            this.client.read(query)
                .then((rows)=> {
                    for (let row of rows){
                        let event = EventRegistry.fromJsonObject(row.event);
                        if (event) events.push(event);
                        resolve(events);
                    }
                }).catch(()=> {
                    resolve(events)
            })
        });
    };

    eventsOfAggregateSince = async (aggregate: string, aggregateId: string, since: Date): Promise<DomainEvent[]> => {
        return new Promise((resolve, reject) => {
            reject(new Error("Not yet implemented"));
        })
    };

    logEvent = async (event: DomainEvent): Promise<boolean> => {
        const query = {
            text: 'INSERT INTO jira.event_log(aggregate_id, aggregate, event_type, generated_on, event) VALUES($1, $2, $3, $4, $5) RETURNING event_type',
            values: [event.aggregateId(), event.aggregate(), event.eventType, event.generatedOn(), JSON.stringify(event)],
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
    }
}
