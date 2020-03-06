import {NextFunction, Request, Response} from "express";
import LogFactory from "../../domain/LogFactory";

export default function sessionCounter() {
    const log = LogFactory.get("sessionCounter");
    // TODO change this to middleware that intercepts /login path and calls google to authenticate and toggles logged in flag. if not redirects to /login page
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.session.views) {
            req.session.views++;
        } else {
            req.session.views = 1
        }
        log.debug(`req url: ${req.url}, session id: ${JSON.stringify(req.session.id)}, session data: ${JSON.stringify(req.session)}`);
        next();
    }
}
