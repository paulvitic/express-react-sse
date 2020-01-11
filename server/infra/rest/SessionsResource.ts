import SessionsQueryService from "../../application/SessionsQueryService";
import {Request, Response} from "express";
import LogFactory from "../../context/LogFactory";

export class SessionsResource {
    private readonly log = LogFactory.get(SessionsResource.name);

    constructor(private readonly queryService: SessionsQueryService){}

    byId = (req: Request, res: Response): void => {
        this.log.info(`session is ${JSON.stringify(req.session)}`)
        this.log.info(`session id is ${req.session.id}`)
        this.queryService.byId(req.session.id)
            .then(r => {
                if (r) res.json(r);
                else res.status(404).end();
            });
    };

    search = (req: Request, res: Response): void => {

    };

    create = (req: Request, res: Response): void => {

    }
}
