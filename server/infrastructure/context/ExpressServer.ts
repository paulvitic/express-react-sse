import express, {Application, RequestHandler, Response} from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import cors from 'cors';
import os from 'os';
import installApiDocs from './apiDoc';
import cookieParser from 'cookie-parser';
import sessionConfig from "./sessionConfig";
import LogFactory from "./LogFactory";
import session, {Store} from "express-session";
import errorHandler from "./errorHandler";
import sessionCounter from "./sessionCounter";
import uuid from "../../domain/uuid";
import serverSentEvents from "./serverSentEvents";
import { TicketBoardsResource } from "../rest";

const installMiddleware = (app: Application): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        app.use(bodyParser.json({limit: process.env.REQUEST_LIMIT || '100kb'}));
        app.use(bodyParser.urlencoded({extended: true, limit: process.env.REQUEST_LIMIT || '100kb'}));
        app.use(bodyParser.text({limit: process.env.REQUEST_LIMIT || '100kb'}));
        app.use(cors());
        app.use(cookieParser());
        app.use(session(sessionConfig(app)));
        app.use(sessionCounter());
        app.use(errorHandler);
        resolve();
    });
};

const addRoutes = (app: Application, resources: Map<string, RequestHandler>): Promise<void> => {
    return new Promise<void>((resolve) => {
        // provide the same static SPA files for all SPA internal routes used
        app.use("/", express.static(`${path.normalize(__dirname + '/../..')}/dist/static`));
        app.use("/login", express.static(`${path.normalize(__dirname + '/../..')}/dist/static`));
        // EventSource API makes a 'GET' request by default, you can not use another HTTP method
        app.get('/events', serverSentEvents(app));
        app.use('/api/v1/users', express.Router()
            .get('/', resources.get("usersSearch"))
            .get('/auth', resources.get("usersAuth")));
        resolve();
    })
};


export default class ExpressServer {
    private readonly log = LogFactory.get(ExpressServer.name);
    private readonly app: Application;

    constructor(private readonly port: number,
                sessionCookieTtl: number,
                sessionStore: session.Store,
                private readonly resources: Map<string, RequestHandler>) {
        this.app = express();
        this.app.set('sessionStore', sessionStore);
        this.app.set('sessionCookieTtl', sessionCookieTtl);
        this.app.set('instanceId', uuid());
        this.app.set('sseClients', new Map<string, Response>());
        this.app.enable('case sensitive routing');
        this.app.enable('strict routing');
    }

    init = (): Promise<ExpressServer> => {
        return new Promise<ExpressServer>(async (resolve, reject) => {

            await installMiddleware(this.app).catch(e => {
                this.log.error(`Error while installing middleware: ${e}`);
                reject(e);
            });

            await addRoutes(this.app, this.resources).catch(e => {
                this.log.error(`Error while adding routes: ${e}`);
                reject(e);
            });

            await installApiDocs(this.app).catch(e => {
                this.log.error(`Error while installing api docs middleware: ${e}`);
                reject(e);
            });

            this.log.info(`Listing server middleware:`);
            require('express-list-middleware')(this.app).forEach((m) => {
                this.log.info(m);
            });

            try {
                http.createServer(this.app).listen(this.port,() => {
                    this.log.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${this.port}}`);
                    resolve(this);
                });
            } catch (e) {
                this.log.error(`error while starting server: ${e}`)
                reject(e);
            }
        })
    };
}
