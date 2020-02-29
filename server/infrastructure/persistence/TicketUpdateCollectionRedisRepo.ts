import RedisClient from "../clients/RedisClient";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";

export class TicketUpdateCollectionRedisRepo extends TicketUpdateCollectionRepository {

    constructor(private readonly redisClient: RedisClient,
                private readonly hash: string) {
        super();
    }

    findById(id: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return undefined;
        // you can use 'SCAN 0 MATCH <pattern>' given that you construct your keys using the possible query params
        // [aggregate]:[id]:[exists]:[name]
        /*return new Promise<T>((resolve, reject) => {
            let result: T;
            this.redisClient.get(`${this.hash}:${id}`)
                .then(value => {
                    resolve(value);
                }).catch(err => {
                    reject(err)
            })
        });*/
    };

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        throw new Error("Method not implemented.");
    }

    findLatestByProject(devProjectId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        throw new Error("Method not implemented.");
    }

    findByProject(devProjectId: string, limit: number): TE.TaskEither<Error, TicketUpdateCollection[]> {
        throw new Error("Method not implemented.");
    }

    save(item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        throw new Error("Method not implemented.");
        /*return new Promise<T>((resolve, reject) => {
            let result: T;
            this.redisClient.set(`${this.hash}:${item.id}`, JSON.stringify(item))
                .then(ok => {
                    if (ok) resolve(item);
                    else reject(new Error('save failed'))
                }).catch(err => {
                reject(err)
            })
        });*/
    }

    update(id: string, item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        throw new Error("Method not implemented.");
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }
}


