import LogFactory from "../../../domain/LogFactory";
import {Request, Response} from "express";
import * as translate from "./TicketUpdateCollectionReqTranslator";
import {CollectTicketUpdates} from "../../../application/product/commands";
import {TicketUpdateCollectionService} from "../../../application/product/TicketUpdateCollectionService";

export const TicketUpdateCollectionEndpoints = {
    create: "CreateTicketUpdateCollection"
};

export class TicketUpdateCollectionResource {
    private readonly log = LogFactory.get(TicketUpdateCollectionResource.name);

    constructor(private service: TicketUpdateCollectionService) {}

    create = (req: Request, res: Response, next): void => {
        this.log.info(`start ticket update collection request received: ${JSON.stringify(req.body)}`);
        translate.toCommand(req).fold(
            err => {
                res.status(400);
                next(err);
            },
            command => {
                switch (command.type) {
                    case CollectTicketUpdates.name:
                        this.service.collectTicketUpdates(command).run()
                            .then(ret => {
                                ret.fold(
                                    err => {
                                        res.status(400);
                                        next(err);
                                    },
                                    id => {
                                        res.status(201)
                                            .location(`/api/v1/ticketUpdateCollections/${id}`)
                                            .json(id)
                                    })
                            })
                            .catch((err) => {
                                res.status(400);
                                next(err);
                            });
                        return;
                    default:
                        res.status(400).json({
                            reason: `${command.type} command not known`
                        })
                }
            }
        )
    }
}
