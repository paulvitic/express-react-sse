import redis, {RedisClient as Client} from 'redis';
import LogFactory from "../../domain/LogFactory";

export type RedisClientParams = {
    host: string,
    port:number,
    password: string,
}

export default class RedisClient {
    private readonly log = LogFactory.get(RedisClient.name);
    private readonly client: Client;

    private constructor(params: RedisClientParams) {
        let {host, port, password} = params;
        this.client = redis.createClient({host, port, password});
    }

    static init = (params: RedisClientParams): Promise<RedisClient> => {
        return new Promise<RedisClient>((resolve, reject) => {
            let redisClient = new RedisClient(params);
            redisClient.log.info(`initializing @${params.host}:${params.port}`);
            redisClient.client.on('error', (err=> {
                redisClient.log.error('could not connect ', err);
                reject(err);
            }));

            redisClient.client.on('connect', ()=> {
                redisClient.log.info(`connected @${params.host}:${params.port}`);
                resolve(redisClient);
            });
        });
    };

    public set = (key: string, value: any): Promise<boolean>  => {
        this.client.set(key, value);
        return new Promise<boolean>((resolve, reject) => {
            this.client.set(key, value, (err: Error, reply: string) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(reply==='OK');
                }
            })
        })
    };

    public get = (key: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, response) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            })
        })
    }
}
