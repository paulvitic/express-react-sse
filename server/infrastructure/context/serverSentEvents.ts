import {Application, NextFunction, Request, Response} from "express";
import LogFactory from "./LogFactory";

const log = LogFactory.get("serverSentEvents");

const serverSentEvents = (app: Application) => {
    
    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.session.id;
        log.info(`server sent events connection called by ${clientId}`);

        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };

        res.writeHead(200, headers);

        // testing only
        const data = `data: ${JSON.stringify({type:"CHANGE_THEME", payload:"green"})}\n\n`;
        res.write(data);

        const clients: Map<string, Response> = app.get("sseClients");
        clients.set(clientId, res);

        req.on('close', () => {
            log.warn(`${req.session.id} Connection closed`);
            clients.delete(clientId);
        });
    };
};

export default serverSentEvents;
