import express, {Application, NextFunction, Request, RequestHandler, Response} from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import cors from 'cors';
import os from 'os';
import cookieParser from 'cookie-parser';
import session from "express-session";
import uuid from "../../domain/uuid";
import {ProductDevelopmentEndpoints, UsersEndpoints} from "../rest";
import LogFactory from "../../domain/LogFactory";
import {TicketUpdateCollectionEndpoints} from "../rest/product/TicketUpdateCollectionResource";
import pgSession, {PGStore} from 'connect-pg-simple';
import swaggerMiddleware from 'swagger-express-middleware';
import PostgresClient from "../clients/PostgresClient";

export default class ExpressServer {
    private readonly log = LogFactory.get(ExpressServer.name);
    private readonly app: Application;
    private readonly instanceId: string;
    private readonly sseClients: Map<string, Response> = new Map<string, Response>();

    constructor(private readonly port: number,
                private readonly sessionCookieTtl: number,
                private readonly sessionSecret: string,
                private readonly requestLimit: string,
                private readonly postgresClient: PostgresClient,
                private readonly resources: Map<string, RequestHandler>) {
        this.instanceId = uuid();
        this.app = express();
        this.app.enable('case sensitive routing');
        this.app.enable('strict routing');
    }

    init = (): Promise<ExpressServer> => {
        return new Promise<ExpressServer>(async (resolve, reject) => {

            await this.installMiddleware().catch(e => {
                this.log.error(`Error while installing middleware: ${e}`);
                reject(e);
            });

            await this.installApiDocs().catch(e => {
                this.log.error(`Error while installing api docs middleware: ${e}`);
                reject(e);
            });

            await this.addRoutes().catch(e => {
                this.log.error(`Error while adding routes: ${e}`);
                reject(e);
            });

            this.app.use(this.errorHandler);

            this.log.info(`Listing server middleware:`);
            require('express-list-middleware')(this.app).forEach((m) => {
                this.log.info(m);
            });

            try {
                http.createServer(this.app).listen(this.port, () => {
                    this.log.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${this.port}`);
                    resolve(this);
                });
            } catch (e) {
                this.log.error(`error while starting server: ${e}`);
                reject(e);
            }
        })
    };

    private installMiddleware = (): Promise<void> => {
        return new Promise<void>((resolve) => {
            this.app.use(bodyParser.json({limit: this.requestLimit || '100kb'}));
            this.app.use(bodyParser.urlencoded({extended: true, limit: this.requestLimit || '100kb'}));
            this.app.use(bodyParser.text({limit: this.requestLimit || '100kb'}));
            this.app.use(cors());
            this.app.use(cookieParser());
            this.app.use(session(this.sessionConfig()));
            this.app.use(this.sessionCounter);
            resolve();
        });
    };

    private addRoutes = (): Promise<void> => {
        return new Promise<void>((resolve) => {
            // Endpoint serving static resources. Provide the same static SPA files for all SPA internal routes used
            this.app.use("/", express.static(`${path.normalize(__dirname + '/../../../')}/dist/static`));
            this.app.use("/login", express.static(`${path.normalize(__dirname + '/../../../')}/dist/static`));

            // Server sent events endpoint. EventSource API makes a 'GET' request by default, you can not use another HTTP method
            this.app.get('/events', this.serverSentEvents);

            // Restful data resources
            this.app.use('/api/v1/users', express.Router()
                .get('/', this.resources.get(UsersEndpoints.search))
                .get('/auth', this.resources.get(UsersEndpoints.authenticate)));

            this.app.use('/api/v1/productDevelopments', express.Router()
                .get('/:id', this.resources.get(ProductDevelopmentEndpoints.byId))
                .get('/', this.resources.get(ProductDevelopmentEndpoints.search))
                .post('/', this.resources.get(ProductDevelopmentEndpoints.create)));

            this.app.use('/api/v1/ticketUpdateCollections', express.Router()
                .get('/', this.resources.get(TicketUpdateCollectionEndpoints.search))
                .post('/', this.resources.get(TicketUpdateCollectionEndpoints.create)));

            resolve();
        })
    };

    private sessionConfig = () => {
        const sessionStore = (): PGStore => {
            const pgStore = pgSession(session);
            return new pgStore({
                pool : this.postgresClient.pool,
                schemaName: 'jira',
                tableName : 'user_sessions'
            });
        };

        const instanceId = this.instanceId;
        // noinspection JSUnusedLocalSymbols
        const sess = {
            name: 'app.sid', // use process.env.SESSION_NAME some obscure name
            secret: this.sessionSecret,
            store: sessionStore(),
            cookie: {
                httpOnly: true, // means you can not access session data with javascript
                secure: false, // make it true for production
                maxAge: this.sessionCookieTtl
            },
            genid: function (req) {
                return `${instanceId}:${uuid()}`;
            },
            saveUninitialized: true,
            resave: false,
            rolling: false
        };

        if (this.app.get('env') === 'production') {
            this.app.set('trust proxy', 1); // trust first proxy, this is not about session config or?
            sess.cookie.secure = true // serve secure cookies
        }

        return sess;
    };

    // ================
    // Middleware
    // ================
    private errorHandler = (err: Error, req: Request, res: Response) => {
        LogFactory.get("RequestErrorHandler").error(`error while handing request ${req.url}\n ${err.stack}`);
        res.status(res.statusCode || 500);
        res.json({name: err.name, message: err.message, stack: err.stack});
    };

    private sessionCounter = (req: Request, res: Response, next: NextFunction) => {
        if (req.session.views) {
            req.session.views++;
        } else {
            req.session.views = 1
        }
        this.log.debug(`req url: ${req.url}, session id: ${JSON.stringify(req.session.id)}, session data: ${JSON.stringify(req.session)}`);
        next();
    };

    private serverSentEvents = (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.session.id;
        this.log.info(`server sent events connection called by ${clientId}`);

        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };

        res.writeHead(200, headers);

        // testing only
        const data = `data: ${JSON.stringify({type: "CHANGE_THEME", payload: "green"})}\n\n`;
        res.write(data);

        const clients: Map<string, Response> = this.sseClients;
        clients.set(clientId, res);

        req.on('close', () => {
            this.log.warn(`${req.session.id} Connection closed`);
            clients.delete(clientId);
        });
    };

    private installApiDocs(): Promise<void> {
        const apiDocsPath = "/api-explorer/";
        let app = this.app;
        let sessionSecret = this.sessionSecret;
        let requestLimit = this.requestLimit;
        return new Promise<void>((resolve, reject) => {
            swaggerMiddleware(path.join(__dirname, 'api.yml'), app, function (err: Error, swagger) {
                if (err) {
                    return reject(err);
                }
                app.use(swagger.metadata());
                app.use(swagger.files(app, {apiPath: '/api/v1/spec'}));
                app.use(swagger.parseRequest({
                    // Configure the cookie parser to use secure cookies
                    cookie: {
                        secret: sessionSecret
                    },
                    // Don't allow JSON content over request limit
                    json: {
                        limit: requestLimit
                    }
                }));
                // These two middleware don't have any options (yet)
                app.use(
                    swagger.CORS(),
                    swagger.validateRequest());
                resolve();
            });
        });
    }
}
