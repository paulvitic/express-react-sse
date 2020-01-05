import ExpressServer from "./ExpressServer";
import LogFactory from "./LogFactory";
import config, {Environment} from "./config";
import RedisClient from "./RedisClient";
import RabbitClient from "./RabbitClient";
import PostgresClient from "./PostgresClient";

const exit = process.exit;

type Context = {
    clients: Map<string, any>
    server: ExpressServer | undefined,
}

export default class App {
    private readonly log = LogFactory.get(App.name);
    private env: Environment;
    private context: Context = {
        clients: new Map<string, any>(),
        server: undefined
    };

    public start = () => {
        this.log.info(`getting configuration`);
        config()
            .then((env: Environment) => {
                this.env = env;
                this.init()
                    .then(() => {
                        this.log.info("App started");
                    })
                    .catch((err) => {
                        this.log.error("App start failed", err);
                        exit(1);
                    });
            }).catch((err) => {
                this.log.error("Configuration failed", err);
                exit(1);
        });
    };

    private init = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            this.initClients()
                .then(() => {
                    this.initServer()
                        .then(() => resolve())
                        .catch((err)=> reject(err))
                });
        })
    };

    private initClients = (): Promise<void> => {
        this.context.clients = new Map<string, any>();
        return new Promise<void>(async (resolve, reject) => {

            new RabbitClient(
                this.env.RABBIT_HOST,
                this.env.RABBIT_PORT,
                this.env.RABBIT_USER,
                this.env.RABBIT_PASS,
                this.env.RABBIT_VHOST
            ).init()
                .then((rabbitClient) => {this.context.clients.set('rabbitClient', rabbitClient);})
                .catch((err) => {reject(err)});

            const postgresClient = await new PostgresClient(
                this.env.POSTGRES_HOST,
                this.env.POSTGRES_PORT,
                this.env.POSTGRES_USER,
                this.env.POSTGRES_DATABASE,
                this.env.POSTGRES_PASS
            ).init()
                .then((postgresClient) => {this.context.clients.set('postgresClient', postgresClient);})
                .catch((err) => {reject(err)});

            const redisClient = await new RedisClient(
                this.env.REDIS_HOST,
                this.env.REDIS_PORT,
                this.env.REDIS_PASS,
                this.env.SESSION_COOKIE_TTL
            ).init()
                .catch((err) => {reject(err)});

            this.context.clients.set('redisClient', redisClient);

            return resolve();
        })
    };

    private initServer = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            new ExpressServer(
                this.env.PORT,
                this.env.SESSION_COOKIE_TTL,
                this.context.clients.get('redisClient').sessionStore())
                .init()
                .then((server)=> {
                    this.context.server = server;
                }).catch(err => {
                    reject(err);
            })
        })
    }
}
