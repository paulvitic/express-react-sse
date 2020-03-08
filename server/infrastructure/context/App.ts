import ExpressServer from "./ExpressServer";
import WinstonLogFactory from "./winstonLogFactory";
import config, {Environment} from "../config/config";
import RedisClient from "../clients/RedisClient";
import RabbitClient from "../clients/RabbitClient";
import PostgresClient from "../clients/PostgresClient";
import {RequestHandler} from "express";
import {
    ProductDevelopmentEndpoints, ProductDevelopmentResource,
    UsersEndpoints, UsersResource} from "../rest";
import ProductDevelopmentService from "../../application/product/ProductDevelopmentService";
import PostgresEventStore from "../persistence/PostgresEventStore";
import EventStore from "../../domain/EventStore";
import RabbitEventBus from "../messaging/RabbitEventBus";
import EventBus from "../../domain/EventBus";
import {registerDomainEvent} from "../JsonEventTranslator";
import {
    ProductDevelopmentCreated,
    TicketBoardLinked,
    TicketChanged,
    TicketRemainedUnchanged,
    TicketUpdateCollectionEnded,
    TicketUpdateCollectionFailed,
    TicketUpdateCollectionStarted,
    UpdatedTicketsListFetched
} from "../../domain/product/event";
import JiraIntegration from "../integration/JiraIntegration";
import LogFactory from "../../domain/LogFactory";
import ProductDevelopmentRepository from "../../domain/product/repository/ProductDevelopmentRepository";
import ProductDevPostgresRepo from "../persistence/ProductDevPostgresRepo";

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
        developmentProjectRepo: ProductDevelopmentRepository
    }
    infrastructure: {
        rest: {
            resources : Map<string, RequestHandler>
        }
    }
}

const registerEvents = function(){
    registerDomainEvent(ProductDevelopmentCreated.name, ProductDevelopmentCreated);
    registerDomainEvent(TicketBoardLinked.name, TicketBoardLinked);
    registerDomainEvent(TicketChanged.name, TicketChanged);
    registerDomainEvent(TicketRemainedUnchanged.name, TicketRemainedUnchanged);
    registerDomainEvent(TicketUpdateCollectionEnded.name, TicketUpdateCollectionEnded);
    registerDomainEvent(TicketUpdateCollectionFailed.name, TicketUpdateCollectionFailed);
    registerDomainEvent(TicketUpdateCollectionStarted.name, TicketUpdateCollectionStarted);
    registerDomainEvent(UpdatedTicketsListFetched.name, UpdatedTicketsListFetched);
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
            developmentProjectRepo: undefined
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
            LogFactory.setLogLevel(this.env.LOG_LEVEL);
            await this.init();
            this.log.info("App started");
        } catch (err) {
            this.log.error(`App start failed: ${err.message}`);
            exit(1);
        }
    };

    private init = (): Promise<void> => {
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
                this.context.clients.set('rabbitClient', await RabbitClient.init(this.env.RABBIT_PARAMS));
                this.context.clients.set('postgresClient', await PostgresClient.init(this.env.POSTGRES_PARAMS));
                this.context.clients.set('redisClient', await RedisClient.init(this.env.REDIS_PARAMS));
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

        let developmentProjectResource = new ProductDevelopmentResource(
            new ProductDevelopmentService(
                this.context.eventBus,
                new ProductDevPostgresRepo(this.context.clients.get("postgresClient")),
                new JiraIntegration(this.env.JIRA_PARAMS)));
        resources.set(ProductDevelopmentEndpoints.create, developmentProjectResource.create);
        resources.set(ProductDevelopmentEndpoints.byId, developmentProjectResource.byId);

        let users = new UsersResource(this.env.GOOGLE_APP_CLIENT_ID, this.env.GOOGLE_APP_CLIENT_SECRET);
        resources.set(UsersEndpoints.authenticate, users.authenticate);
        resources.set(UsersEndpoints.search, users.search);

        return new Promise<void>((resolve, reject) => {
            new ExpressServer(
                this.env.PORT,
                this.env.SESSION_COOKIE_TTL,
                this.context.clients.get('redisClient'),
                resources
            ).init().then((server) => {
                    this.context.server = server;
                }).catch(err => {
                    reject(err);
                })
        })
    }
}
