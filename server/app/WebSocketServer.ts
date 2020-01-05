import * as WebSocket from "ws";
import LogFactory from "./LogFactory";
import {Server as HttpServer} from "http";
import { Server } from "ws";

export default class WebSocketServer {
    private readonly log = LogFactory.get(WebSocketServer.name);
    private readonly wss: Server;
    private readonly broadcastRegex = /^broadcast:/;

    constructor(server: HttpServer) {
        this.wss = new WebSocket.Server({ server });
    }

    init = (): Promise<WebSocketServer> => {
        return new Promise<WebSocketServer>((resolve, reject) => {
            this.wss.on('connection', (ws: WebSocket) => {
                ws.on('message', (message: string) => this.onMessage(ws, message));
                ws.send(JSON.stringify({type: "SERVER_CONNECTION", payload: "server instance id"}));
            });
            resolve(this);
        })
    };


    private onMessage = (ws: WebSocket, message: string) => {
        this.log.info(`received: ${message}`);
        const action = JSON.parse(message);
        if (action.type === "BROADCAST") {
            this.broadCast(ws, action.payload);
        } else {
            ws.send(JSON.stringify({type: "CHANGE_THEME", payload: "green"}));
        }
    };

    private broadCast = (sender: WebSocket, message: string) => {
        this.wss.clients
            .forEach(client => {
                if (client != sender) {
                    client.send(JSON.stringify({type: "BROADCAST", payload: message}));
                }
            });
    }

    // TODO add heartbeat, see: https://gist.github.com/thiagof/aba7791ef9504c1184769ce401f478dc
}


