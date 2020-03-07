import ExpressServer from "./ExpressServer";
import WinstonLogFactory from "./winstonLogFactory";
import config, {Environment} from "../config/config";
import RedisClient from "../clients/RedisClient";
import RabbitClient from "../clients/RabbitClient";
import PostgresClient from "../clients/PostgresClient";
import {RequestHandler} from "express";
import {DevelopmentProjectEndpoints, DevelopmentProjectResource} from "../rest";
import DevelopmentProjectService from "../../application/product/DevelopmentProjectService";
import {UsersEndpoints, UsersResource} from "../rest/team/UsersResource";
import PostgresEventStore from "../persistence/PostgresEventStore";
import EventStore from "../../domain/EventStore";
import RabbitEventBus from "../messaging/RabbitEventBus";
import EventBus from "../../domain/EventBus";
import {registerDomainEvent} from "../JsonEventTranslator";
import {
    DevelopmentProjectCreated,
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
import DevelopmentProjectRepository from "../../domain/product/repository/DevelopmentProjectRepository";
import DevelopmentProjectPostgresRepo from "../persistence/DevelopmentProjectPostgresRepo";

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
        developmentProjectRepo: DevelopmentProjectRepository
    }
    infrastructure: {
        rest: {
            resources : Map<string, RequestHandler>
        }
    }
}

const registerEvents = function(){
    registerDomainEvent(DevelopmentProjectCreated.name, DevelopmentProjectCreated);
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
            this.log.error("App start failed", err);
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

        let developmentProjectResource = new DevelopmentProjectResource(
            new DevelopmentProjectService(
                this.context.eventBus,
                new DevelopmentProjectPostgresRepo(this.context.clients.get("postgresClient")),
                new JiraIntegration(this.env.JIRA_PARAMS)));

        let {resources} = this.context.infrastructure.rest;
        resources.set(DevelopmentProjectEndpoints.create, developmentProjectResource.create);
        resources.set(DevelopmentProjectEndpoints.byId, developmentProjectResource.byId);

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
