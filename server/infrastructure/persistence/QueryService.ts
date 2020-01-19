import RedisClient from "../clients/RedisClient";
import AggregateRoot from "../../domain/AggregateRoot";
import EventStore from "../../domain/EventStore";
import TicketBoard from "../../domain/product/TicketBoard";

export default abstract class QueryService<A extends AggregateRoot> {
    private readonly hash: string;

    constructor(private readonly aggregateType: any,
                private readonly cache: RedisClient,
                private readonly eventStore: EventStore) {
        this.hash = aggregateType.name;
    }

    exists = (id: string): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            let cached = this.cache.get(id);
            if (cached) {
                return resolve(true);
            }
        })
    };

    findOne = (aggregateType: string, id: string): Promise<A> => {
        return new Promise<A>(async resolve => {
            let cacheValue = await this.cache.get(id);

            if (cacheValue) {
                const cached:A = new this.aggregateType(id);
                Object.assign(cached, JSON.parse(cacheValue));
                resolve(cached);

            } else {
                let events = await this.eventStore.eventsOfAggregate(aggregateType, id);
                if (events && events.length>0) {
                    let reconstructed:A = new this.aggregateType(events);
                    await this.cache.set(id, JSON.stringify(reconstructed));
                    resolve(reconstructed);
                }
            }
        })
    }
}

export class TicketBoardsQueryService extends QueryService<TicketBoard> {}
