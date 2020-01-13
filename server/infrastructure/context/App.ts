import ExpressServer from "./ExpressServer";
import LogFactory from "./LogFactory";
import config, {Environment} from "./config";
import RedisCache from "./RedisCache";
import RabbitClient from "./RabbitClient";
import PostgresClient from "./PostgresClient";
import {RequestHandler} from "express";
import {ExamplesResource} from "../rest";
import ExamplesService from "../../application/ExamplesService";
import SessionsQueryService from "../../application/SessionsQueryService";
import {UsersResource} from "../rest/UsersResource";
import PostgresEventStore from "../persistence/PostgresEventStore";
import EventStore from "../../domain/EventStore";
import RabbitEventBus from "../message/RabbitEventBus";
import EventBus from "../../domain/EventBus";

const exit = process.exit;

type Context = {
    clients: Map<string, any>,
    eventStore: EventStore,
    eventBus: EventBus;
    server: ExpressServer,
    application: {
        services: []
    },
    infrastructure: {
        rest: {
            resources : Map<string, RequestHandler>
        }
    }
}

export default class App {
    private readonly log = LogFactory.get(App.name);
    private env: Environment;
    private context: Context = {
        clients: new Map<string, any>(),
        eventStore: undefined,
        eventBus: undefined,
        server: undefined,
        application: {
            services: []
        },
        infrastructure: {
            rest: {
                resources : new Map<string, RequestHandler>(),
            }
        }
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
                .then((success) => {
                    if (success) {
                        this.initServer()
                            .then(() => resolve())
                            .catch((err)=> reject(err))
                    }
                });
        })
    };

    private initClients = (): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            RabbitClient.init(
                this.env.RABBIT_HOST,
                this.env.RABBIT_PORT,
                this.env.RABBIT_USER,
                this.env.RABBIT_PASS,
                this.env.RABBIT_VHOST)
                .then((rabbitClient) => {
                    this.context.clients.set('rabbitClient', rabbitClient);
                    new PostgresClient(
                        this.env.POSTGRES_HOST,
                        this.env.POSTGRES_PORT,
                        this.env.POSTGRES_USER,
                        this.env.POSTGRES_DATABASE,
                        this.env.POSTGRES_PASS
                    ).init()
                        .then((postgresClient) => {
                            this.context.clients.set('postgresClient', postgresClient);
                            new RedisCache(
                                this.env.REDIS_HOST,
                                this.env.REDIS_PORT,
                                this.env.REDIS_PASS,
                                this.env.SESSION_COOKIE_TTL
                            ).init()
                                .then((redisClient) => {
                                    this.context.clients.set('redisClient', redisClient);
                                    resolve(true)
                                })
                                .catch((err) => {reject(err)});
                        })
                        .catch((err) => {reject(err)});
                }).catch((err)=> {
                    reject(err)
            });
        })
    };

    private initServer = (): Promise<void> => {
        this.context.eventStore = new PostgresEventStore(this.context.clients.get("postgresClient"));
        RabbitEventBus.init(this.context.clients.get("rabbitClient"), this.context.eventStore)
            .then((eventBus) => {
                this.context.eventBus = eventBus
            });

        let {resources} = this.context.infrastructure.rest;

        let examples = new ExamplesResource(new ExamplesService(undefined));
        resources.set("examplesCreate", examples.create());
        resources.set("examplesAll", examples.all());
        resources.set("examplesById", examples.byId());

        let users = new UsersResource(this.env.GOOGLE_APP_CLIENT_ID, this.env.GOOGLE_APP_CLIENT_SECRET);
        resources.set("usersAuth", users.authenticate);
        resources.set("usersSearch", users.search);

        return new Promise<void>((resolve, reject) => {
            new ExpressServer(
                this.env.PORT,
                this.env.SESSION_COOKIE_TTL,
                this.context.clients.get('redisClient').sessionStore(),
                resources)
                .init()
                .then((server)=> {
                    this.context.server = server;
                }).catch(err => {
                    reject(err);
            })
        })
    }
}
