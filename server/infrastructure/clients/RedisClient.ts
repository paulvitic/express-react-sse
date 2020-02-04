import redis, {RedisClient as Client} from 'redis';
import WinstonLogFactory from "../context/WinstonLogFactory";

// TODO get rid og cache integrate tis to redis repository
export default class RedisClient {
    private readonly log = WinstonLogFactory.get(RedisClient.name);
    private readonly client: Client;

    constructor(private readonly host: string,
                private readonly port:number,
                password: string) {
        this.client = redis.createClient({host, port, password});
    }

    public init = (): Promise<RedisClient> => {
        this.log.info(`initializing @${this.host}:${this.port}`);

        return new Promise<RedisClient>((resolve, reject) => {
            this.client.on('error', (err=> {
                this.log.error('could not connect ', err);
                reject(err);
            }));

            this.client.on('connect', ()=> {
                this.log.info(`connected @${this.host}:${this.port}`);
                resolve(this);
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
