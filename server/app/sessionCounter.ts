import {NextFunction, Request, Response} from "express";
import LogFactory from "./LogFactory";

const log = LogFactory.get("sessionCounter");

export default function sessionCounter() {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.session.views) {
            req.session.views++;
        } else {
            req.session.views = 1
        }
        log.info(`req url: ${req.url}, session id: ${JSON.stringify(req.session.id)}, session data: ${JSON.stringify(req.session)}`);
        next();
    }
}
