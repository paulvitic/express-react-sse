import LogFactory from "../../../domain/LogFactory";
import {Request, Response} from "express";
import * as translate from "./TicketUpdateCollectionReqTranslator";
import {CollectTicketUpdates} from "../../../application/product/commands";
import {TicketUpdateCollectionService} from "../../../application/product/TicketUpdateCollectionService";
import {TicketUpdateCollectionRepository} from "../../../domain/product/repository/";
import * as O from "fp-ts/lib/Option";

export const TicketUpdateCollectionEndpoints = {
    search: "SearchTicketUpdateCollections",
    create: "CreateTicketUpdateCollection"
};

export class TicketUpdateCollectionResource {
    private readonly log = LogFactory.get(TicketUpdateCollectionResource.name);
    constructor(private service: TicketUpdateCollectionService,
                private repo: TicketUpdateCollectionRepository) {
    }

    search = (req: Request, res: Response, next): void => {
        this.log.info(`search ticket update collections request received: ${JSON.stringify(req.body)}`);
        translate.toSearchMethod(req).fold(
            err => {
                res.status(400);
                next(err);
            },
            method => {
                switch (method.name) {
                    case translate.searchMethod.findLatestByProductId:
                        this.repo.findLatestByProject(
                            method.params.get(translate.searchParam.productDevId))
                            .run().then(ret => {
                                ret.fold(
                                    err => {
                                        res.status(400);
                                        next(err);
                                    },
                                    (optionalResult: O.Option<any>) => {
                                        res.status(200);
                                        res.send(optionalResult.isSome() ?
                                                JSON.stringify(
                                                    optionalResult.value,
                                                    (key, value)=> value instanceof Map ?  Object.fromEntries(value.entries()) : value,
                                                    2) :
                                            {})
                                    })
                            })
                            .catch((err) => {
                                res.status(400);
                                next(err);
                            });
                        return;
                }
            })
    };

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
