import RedisClient from "../clients/RedisClient";
import AggregateRoot from "../../domain/AggregateRoot";
import EventStore from "../../domain/EventStore";
import TicketBoard from "../../domain/product/TicketBoard";
import {QueryService} from "../../domain/QueryService";
import LogFactory from "../context/LogFactory";

export default abstract class RedisQueryService<A extends AggregateRoot> implements QueryService<A>{
    private readonly log = LogFactory.get(RedisQueryService.name)
    private readonly hash: string;

    constructor(private readonly aggregateType: any,
                private readonly redisClient: RedisClient,
                private readonly eventStore: EventStore) {
        this.hash = aggregateType.name;
    }

    exists = (id: string): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            let cached = this.redisClient.get(id);
            this.log.info(`cached: ${JSON.stringify(cached)}`);
            // FIXME always returns false
            resolve(cached!==null);
        })
    };

    findOne = (aggregateType: string, id: string): Promise<A> => {
        return new Promise<A>(async resolve => {
            let cacheValue = await this.redisClient.get(id);

            if (cacheValue) {
                const cached:A = new this.aggregateType(id);
                Object.assign(cached, JSON.parse(cacheValue));
                resolve(cached);

            } else {
                let events = await this.eventStore.eventsOfAggregate(aggregateType, id);
                if (events && events.length>0) {
                    let reconstructed:A = new this.aggregateType(events);
                    await this.redisClient.set(id, JSON.stringify(reconstructed));
                    resolve(reconstructed);
                }
            }
        })
    };

    execute(query: any): Promise<A[]> {
        return undefined;
    }
}

export class TicketBoardsQueryService extends RedisQueryService<TicketBoard> {}
