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
import {
    TicketUpdateCollectionEndpoints,
    TicketUpdateCollectionResource
} from "../rest/product/TicketUpdateCollectionResource";
import {TicketUpdateCollectionService} from "../../application/product/TicketUpdateCollectionService";
import {TicketUpdateCollectionPostgresQuery} from "../persistence/TicketUpdateCollectionPostgresQuery";
import {TicketUpdateCollectionTracker} from "../../domain/product/process/ticketUpdateCollection/TicketUpdateCollectionTracker";
import TicketUpdateCollectionPostgresRepo from "../persistence/TicketUpdateCollectionPostgresRepo";
import UpdatedTicketsListCollector
    from "../../domain/product/process/ticketUpdateCollection/UpdatedTicketsListCollector";
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketBoardIntegration from "../../domain/product/service/TicketBoardIntegration";
import {TicketUpdateCollectionQueryService} from "../../application/product/TicketUpdateCollectionQueryService";
import TicketChangeLogReader from "../../domain/product/process/ticketUpdateCollection/TicketChangeLogReader";

const exit = process.exit;

type Context = {
    common: {
        clients: {
            rabbitMQClient?: RabbitClient
            postgresClient?: PostgresClient
            redisClient?: RedisClient
        },
        eventBus: EventBus;
        server: ExpressServer,
    }
    product: {
        domain: {
            repositories: {
                productDevelopmentRepo?: ProductDevelopmentRepository,
                ticketUpdateCollectionRepo?: TicketUpdateCollectionRepository
            },
            services: {
                ticketBoardIntegration?: TicketBoardIntegration
            },
            processors:{
                ticketUpdateCollectionTracker?: TicketUpdateCollectionTracker,
                updatedTicketsListCollector?: UpdatedTicketsListCollector
                ticketChangeLogReader?: TicketChangeLogReader
            },
        },
        application: {
            services: {
                productDevelopmentService?: ProductDevelopmentService
                ticketUpdateCollectionService?: TicketUpdateCollectionService
                ticketUpdateCollectionQueryService?: TicketUpdateCollectionQueryService
            }
        },
        infrastructure: {
            rest: {
                productDevelopmentResource? : ProductDevelopmentResource,
                ticketUpdateCollectionResource?: TicketUpdateCollectionResource
            }
        }
    },
    team: {
        domain: {
            repositories: {},
            services: {},
            processors:{},
        },
        application: {
            services: {}
        },
        infrastructure: {
            rest: {
                userResource? : UsersResource,
            }
        }
    }
}

export default class App {
    private log;
    private env: Environment;
    private context: Context = {
        common: {
            clients: {},
            eventBus: undefined,
            server: undefined
        },
        product: {
            domain: {
                repositories: {},
                services: {},
                processors: {}
            },
            application: {
                services: {}
            },
            infrastructure: {
                rest: {}
            }
        },
        team: {
            domain: {
                repositories: {},
                services: {},
                processors: {}
            },
            application: {
                services: {}
            },
            infrastructure: {
                rest: {}
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
                await this.initClients();
                await this.initEventBus();

                await this.initRepositories();
                await this.initDomainServices();
                await this.initProcessors();

                await this.initApplicationServices();
                await this.initResources();

                await this.registerEvents();
                await this.initDomainEventListeners();

                await this.initServer();
            } catch (err) {
                reject(new Error("error while initializing app: " + err.message ))
            }
        })
    };

    private initClients = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this.context.common.clients.rabbitMQClient = await RabbitClient.init(this.env.RABBIT_PARAMS);
                this.context.common.clients.postgresClient = await PostgresClient.init(this.env.POSTGRES_PARAMS);
                this.context.common.clients.redisClient = await RedisClient.init(this.env.REDIS_PARAMS);
                resolve()
            } catch (err) {
                reject(new Error("error while initializing clients: " + err.message ))
            }
        })
    };

    private initEventBus = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this.context.common.eventBus = await RabbitEventBus.init(
                    this.context.common.clients.rabbitMQClient,
                    new PostgresEventStore(this.context.common.clients.postgresClient));
                resolve();
            }catch (e) {
                reject(new Error("error while initializing event bus: " + e.message ))
            }
        })
    };

    private initRepositories = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                this.context.product.domain.repositories.productDevelopmentRepo =
                    new ProductDevPostgresRepo(this.context.common.clients.postgresClient);
                this.context.product.domain.repositories.ticketUpdateCollectionRepo =
                    new TicketUpdateCollectionPostgresRepo(this.context.common.clients.postgresClient);
                resolve();
            } catch (e) {
                reject(new Error("error while initializing repositories: " + e.message ))
            }
        })
    };

    private initDomainServices = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                this.context.product.domain.services.ticketBoardIntegration =
                    new JiraIntegration(this.env.JIRA_PARAMS);
                resolve();
            } catch (e) {
                reject(new Error("error while initializing domain services: " + e.message ))
            }
        })
    };

    private initProcessors = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                this.context.product.domain.processors.ticketUpdateCollectionTracker =
                    new TicketUpdateCollectionTracker(
                        this.context.product.domain.repositories.ticketUpdateCollectionRepo,
                        this.context.common.eventBus);
                this.context.product.domain.processors.updatedTicketsListCollector =
                    new UpdatedTicketsListCollector(
                        this.context.common.eventBus,
                        this.context.product.domain.services.ticketBoardIntegration
                    );
                this.context.product.domain.processors.ticketChangeLogReader =
                    new TicketChangeLogReader(
                        this.context.common.eventBus,
                        this.context.product.domain.services.ticketBoardIntegration
                    );
                resolve()
            } catch (e) {
                reject(new Error("error while initializing processors: " + e.message ))
            }
        })
    };

    private initApplicationServices = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this.context.product.application.services.productDevelopmentService =
                    new ProductDevelopmentService(
                        this.context.common.eventBus,
                        this.context.product.domain.repositories.productDevelopmentRepo,
                        this.context.product.domain.services.ticketBoardIntegration);

                this.context.product.application.services.ticketUpdateCollectionQueryService =
                    new TicketUpdateCollectionPostgresQuery(this.context.common.clients.postgresClient);

                this.context.product.application.services.ticketUpdateCollectionService =
                    new TicketUpdateCollectionService(
                        this.context.product.application.services.ticketUpdateCollectionQueryService,
                        this.context.product.domain.processors.ticketUpdateCollectionTracker
                    );
                resolve();
            }catch (e) {
                reject(new Error("error while initializing application services: " + e.message ))
            }
        })
    };

    private registerEvents = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                registerDomainEvent(ProductDevelopmentCreated.name, ProductDevelopmentCreated);
                registerDomainEvent(TicketBoardLinked.name, TicketBoardLinked);
                registerDomainEvent(TicketChanged.name, TicketChanged);
                registerDomainEvent(TicketRemainedUnchanged.name, TicketRemainedUnchanged);
                registerDomainEvent(TicketUpdateCollectionEnded.name, TicketUpdateCollectionEnded);
                registerDomainEvent(TicketUpdateCollectionFailed.name, TicketUpdateCollectionFailed);
                registerDomainEvent(TicketUpdateCollectionStarted.name, TicketUpdateCollectionStarted);
                registerDomainEvent(UpdatedTicketsListFetched.name, UpdatedTicketsListFetched);
                resolve();
            }catch (e) {
                reject(new Error("error while registering events: " + e.message ))
            }
        })
    };



    private initResources = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this.context.team.infrastructure.rest.userResource =
                    new UsersResource(this.env.GOOGLE_APP_CLIENT_ID, this.env.GOOGLE_APP_CLIENT_SECRET);

                this.context.product.infrastructure.rest.productDevelopmentResource =
                    new ProductDevelopmentResource(this.context.product.application.services.productDevelopmentService);

                this.context.product.infrastructure.rest.ticketUpdateCollectionResource =
                    new TicketUpdateCollectionResource(
                        this.context.product.application.services.ticketUpdateCollectionService);

                resolve();
            }catch (e) {
                reject(new Error("error while initializing resources: " + e.message ))
            }
        })
    };

    private initDomainEventListeners = (): Promise<void> => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this.context.common.eventBus.subscribe(
                    this.context.product.domain.processors.ticketUpdateCollectionTracker, [
                        TicketUpdateCollectionFailed.name,
                        UpdatedTicketsListFetched.name,
                        TicketChanged.name,
                        TicketRemainedUnchanged.name
                    ]);
                this.context.common.eventBus.subscribe(
                    this.context.product.domain.processors.updatedTicketsListCollector, [
                        TicketUpdateCollectionStarted.name
                    ]);

                this.context.common.eventBus.subscribe(
                    this.context.product.domain.processors.ticketChangeLogReader, [
                        UpdatedTicketsListFetched.name
                    ]);
                resolve();
            } catch (e) {
                reject(new Error("error while initializing event store: " + e.message ))
            }
        })
    };

    private initServer = async (): Promise<void> => {
        let resources = new Map<string, RequestHandler>();

        resources.set(UsersEndpoints.authenticate, this.context.team.infrastructure.rest.userResource.authenticate);
        resources.set(UsersEndpoints.search, this.context.team.infrastructure.rest.userResource.search);

        resources.set(ProductDevelopmentEndpoints.create, this.context.product.infrastructure.rest.productDevelopmentResource.create);
        resources.set(ProductDevelopmentEndpoints.byId, this.context.product.infrastructure.rest.productDevelopmentResource.byId);

        resources.set(TicketUpdateCollectionEndpoints.create, this.context.product.infrastructure.rest.ticketUpdateCollectionResource.create);

        return new Promise<void>((resolve, reject) => {
            new ExpressServer(
                this.env.PORT,
                this.env.SESSION_COOKIE_TTL,
                this.context.common.clients.redisClient,
                resources
            ).init().then((server) => {
                    this.context.common.server = server;
                }).catch(err => {
                    reject(err);
                })
        })
    }
}
