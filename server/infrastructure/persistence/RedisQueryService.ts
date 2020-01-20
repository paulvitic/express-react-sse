import RedisClient from "../clients/RedisClient";
import AggregateRoot from "../../domain/AggregateRoot";
import EventStore from "../../domain/EventStore";
import TicketBoard from "../../domain/product/TicketBoard";
import {QueryService} from "../../domain/QueryService";
import LogFactory from "../context/LogFactory";
import DomainEvent from "../../domain/DomainEvent";

export default abstract class RedisQueryService<A extends AggregateRoot> implements QueryService<A>{
    private readonly log = LogFactory.get(RedisQueryService.name);
    private readonly hash: string;

    constructor(private readonly aggregateType: any,
                private readonly redisClient: RedisClient,
                private readonly eventStore: EventStore) {
        this.hash = aggregateType.name;
    }

    exists = (id: string): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            this.findOne(id).then(cached => {
                resolve(cached!==null);
            }).catch(err => {
                reject(err);
            });
        })
    };

    findOne = (id: string): Promise<A> => {
        let hashedId = `${this.hash}:${id}`;
        return new Promise<A>(async resolve => {
            let cacheValue = await this.redisClient.get(hashedId);
            if (cacheValue) {
                const cached:A = new this.aggregateType(id);
                Object.assign(cached, JSON.parse(cacheValue));
                resolve(cached);
            } else {
                let events: DomainEvent[] = await this.eventStore.eventsOfAggregate(this.hash, id);
                if (events && events.length > 0) {
                    let reconstructed:A = new this.aggregateType(events);
                    await this.redisClient.set(hashedId, JSON.stringify(reconstructed));
                    resolve(reconstructed);
                } else {
                    resolve(null)
                }
            }
        })
    };

    execute(query: any): Promise<A[]> {
        return undefined;
    }
}

export class TicketBoardsQueryService extends RedisQueryService<TicketBoard> {}
