import redis, {RedisClient as Client} from 'redis';
import session from 'express-session';
import connectRedis, {RedisStore} from 'connect-redis';
import LogFactory from "./LogFactory";
import {KeyValueStore} from "../application/KeyValueStore";

export default class RedisCache implements KeyValueStore<string, string> {
    private readonly log = LogFactory.get(RedisCache.name);
    private readonly redisClient: Client;

    constructor(private readonly host: string,
                private readonly port:number,
                password: string,
                private readonly sessionCookieTtl: number,
                ) {
        this.redisClient = redis.createClient({host, port, password});
    }

    public init = (): Promise<RedisCache> => {
        this.log.info(`initializing @${this.host}:${this.port}`);

        return new Promise<RedisCache>((resolve, reject) => {
            this.redisClient.on('error', (err=> {
                this.log.error('could not connect ', err);
                reject(err);
            }));

            this.redisClient.on('connect', ()=> {
                this.log.info(`connected @${this.host}:${this.port}`);
                resolve(this);
            });
        });
    };

    public sessionStore = (): RedisStore => {
        const redisStore = connectRedis(session);
        return  new redisStore({
            host: this.host,
            port: this.port,
            db: 0,
            client: this.redisClient,
            ttl:  this.sessionCookieTtl
        });
    };

    public set = (key: string, value: string) => {
        this.redisClient.set(key, value);
    };

    public get = (key: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            this.redisClient.get(key, (err, response) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(response));
                }
            })
        })
    }
}
