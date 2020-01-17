import ExpressServer from "./ExpressServer";
import LogFactory from "./LogFactory";
import config, {Environment} from "./config";
import RedisCache from "./RedisCache";
import RabbitClient from "../clients/RabbitClient";
import PostgresClient from "../clients/PostgresClient";
import {RequestHandler} from "express";
import {TicketBoardsResource} from "../rest";
import TicketBoardsService from "../../application/product/TicketBoardsService";
import {UsersResource} from "../rest/team/UsersResource";
import PostgresEventStore from "../persistence/PostgresEventStore";
import EventStore from "../../domain/EventStore";
import RabbitEventBus from "../messaging/RabbitEventBus";
import EventBus from "../../domain/EventBus";
import {Repository} from "../../domain/Repository";
import TicketBoard from "../../domain/product/TicketBoard";
import {TicketBoardRedisRepo} from "../persistence/RedisRepository";
import {registerDomainEvent} from "../JsonEventTranslator";
import AddTicketBoard from "../../application/product/commands/AddTicketBoard";

const exit = process.exit;

type Context = {
    clients: Map<string, any>,
    eventStore: EventStore,
    eventBus: EventBus;
    server: ExpressServer,
    application: {
        services: []
    },
    repositories: {
        ticketBoardRepo: Repository<TicketBoard>
    }
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
        repositories: {
            ticketBoardRepo: undefined
        },
        infrastructure: {
            rest: {
                resources : new Map<string, RequestHandler>(),
            }
        }
    };

    public start = async () => {
        this.log.info(`getting configuration`);
        try {
            this.env = await config();
            await this.init();
            this.log.info("App started");
        } catch (err) {
            this.log.error("App start failed", err);
            exit(1);
        }
    };

    private init = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let success = await this.initClients();
                if (success) {
                    await this.registerEvents();
                    await this.initServer();
                }
            } catch (err) {
                reject(err)
            }
        })
    };

    private initClients = (): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                this.context.clients.set('rabbitClient',
                    await RabbitClient.init(
                        this.env.RABBIT_HOST,
                        this.env.RABBIT_PORT,
                        this.env.RABBIT_USER,
                        this.env.RABBIT_PASS,
                        this.env.RABBIT_VHOST));

                this.context.clients.set('postgresClient',
                    await new PostgresClient(
                        this.env.POSTGRES_HOST,
                        this.env.POSTGRES_PORT,
                        this.env.POSTGRES_USER,
                        this.env.POSTGRES_DATABASE,
                        this.env.POSTGRES_PASS
                    ).init());

                this.context.clients.set('redisClient',
                    await new RedisCache(
                        this.env.REDIS_HOST,
                        this.env.REDIS_PORT,
                        this.env.REDIS_PASS,
                        this.env.SESSION_COOKIE_TTL
                    ).init());

                resolve(true)
            } catch (err) {
                reject(err)
            }
        })
    };

    private registerEvents(){
        registerDomainEvent(AddTicketBoard.name, AddTicketBoard)
    }

    private initServer = (): Promise<void> => {
        this.context.eventStore = new PostgresEventStore(this.context.clients.get("postgresClient"));
        RabbitEventBus.init(this.context.clients.get("rabbitClient"), this.context.eventStore)
            .then((eventBus) => {
                this.context.eventBus = eventBus
            });

        this.context.repositories.ticketBoardRepo = new TicketBoardRedisRepo(
            this.context.clients.get('redisClient'),
            TicketBoard.name);

        let {resources} = this.context.infrastructure.rest;

        let ticketBoardsResource = new TicketBoardsResource(
            new TicketBoardsService(
                this.context.eventBus,
                this.context.repositories.ticketBoardRepo));
        resources.set("examplesCreate", ticketBoardsResource.create);
        resources.set("examplesById", ticketBoardsResource.byId);

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
