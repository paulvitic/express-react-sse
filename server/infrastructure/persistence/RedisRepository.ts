import fs from "fs"
import {Repository} from "../../domain/Repository";
import AggregateRoot from "../../domain/AggregateRoot";
import TicketBoard from "../../domain/product/TicketBoard";
import RedisCache from "../context/RedisCache";

export abstract class RedisRepository<T extends AggregateRoot> implements Repository<T> {

    constructor(private readonly cache: RedisCache,
                private readonly hash: string) {}

    delete(id: string): Promise<boolean> {
        throw new Error();
    }

    find(item: T): Promise<T[]> {
        // you can use 'SCAN 0 MATCH <pattern>' given that you construct your keys using the possible query params
        // [aggregate]:[id]:[exists]:[name]
        throw new Error('not implemented');
    }

    findOne = async (id: string): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            let result: T;
            this.cache.get(`${this.hash}:${id}`)
                .then(json => {
                    try {
                        resolve(JSON.parse(json));
                    } catch (err) {
                        reject(err);
                    }
                }).catch(err => {
                    reject(err)
            })
        });
    };

    save = (item: T): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            let result: T;
            this.cache.set(`${this.hash}:${item.id}`, JSON.stringify(item))
                .then(ok => {
                    if (ok) resolve(item);
                    else reject(new Error('save failed'))
                }).catch(err => {
                    reject(err)
            })
        });
    };

    update(id: string, item: T): Promise<T> {
        throw new Error('not implemented');
    }
}

export class TicketBoardRedisRepo extends RedisRepository<TicketBoard> {}
