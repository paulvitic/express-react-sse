import ExpressServer from "./ExpressServer";
import WinstonLogFactory from "./winstonLogFactory";
import config, {Environment} from "../config/config";
import RedisClient from "../clients/RedisClient";
import RabbitClient from "../clients/RabbitClient";
import PostgresClient from "../clients/PostgresClient";
import {RequestHandler} from "express";
import {TicketBoardsResource, TicketBoardsEndpoints} from "../rest";
import TicketBoardsService from "../../application/product/TicketBoardsService";
import {UsersEndpoints, UsersResource} from "../rest/team/UsersResource";
import PostgresEventStore from "../persistence/PostgresEventStore";
import EventStore from "../../domain/EventStore";
import RabbitEventBus from "../messaging/RabbitEventBus";
import EventBus from "../../domain/EventBus";
import {Repository} from "../../domain/Repository";
import TicketBoard from "../../domain/product/TicketBoard";
import {registerDomainEvent} from "../JsonEventTranslator";
import {TicketBoardCreated} from "../../domain/product/events/TicketBoardCreated";
import JiraIntegration from "../integration/JiraIntegration";
import TicketBoardPostgresRepo from "../persistence/TicketBoardPostgresRepo";
import LogFactory from "../../domain/LogFactory";

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

const registerEvents = function(){
    registerDomainEvent(TicketBoardCreated.name, TicketBoardCreated)
};

export default class App {
    private log;
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
        LogFactory.init(new WinstonLogFactory());
        this.log = LogFactory.get(App.name);
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
        LogFactory.init(new WinstonLogFactory());
        return new Promise<void>(async (resolve, reject) => {
            try {
                let success = await this.initClients();
                if (success) {
                    await registerEvents();
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
                    await new RedisClient(
                        this.env.REDIS_HOST,
                        this.env.REDIS_PORT,
                        this.env.REDIS_PASS
                    ).init());

                resolve(true)
            } catch (err) {
                reject(err)
            }
        })
    };

    private initServer = async (): Promise<void> => {
        this.context.eventStore = new PostgresEventStore(this.context.clients.get("postgresClient"));
        this.context.eventBus = await RabbitEventBus.init(this.context.clients.get("rabbitClient"), this.context.eventStore);

        let {resources} = this.context.infrastructure.rest;

        let ticketBoardsResource = new TicketBoardsResource(
            new TicketBoardsService(
                this.context.eventBus,
                new TicketBoardPostgresRepo(this.context.clients.get("postgresClient")),
                new JiraIntegration(this.env.JIRA_URL,
                    this.env.JIRA_USER,
                    this.env.JIRA_API_TOKEN)));
        resources.set(TicketBoardsEndpoints.create, ticketBoardsResource.create);
        resources.set(TicketBoardsEndpoints.byId, ticketBoardsResource.byId);

        let users = new UsersResource(this.env.GOOGLE_APP_CLIENT_ID, this.env.GOOGLE_APP_CLIENT_SECRET);
        resources.set(UsersEndpoints.authenticate, users.authenticate);
        resources.set(UsersEndpoints.search, users.search);

        return new Promise<void>((resolve, reject) => {
            new ExpressServer(
                this.env.PORT,
                this.env.SESSION_COOKIE_TTL,
                this.context.clients.get('redisClient'),
                resources)
                .init()
                .then((server) => {
                    this.context.server = server;
                }).catch(err => {
                    reject(err);
                })
        })
    }
}
