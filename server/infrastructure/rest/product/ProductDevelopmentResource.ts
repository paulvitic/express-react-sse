import ProductDevelopmentService from '../../../application/product/ProductDevelopmentService';
import {Request, Response} from 'express';
import * as translate from "./ProductDevelopmentReqTranslator";
import {CreateProjectFromTicketBoard} from "../../../application/product/commands";
import LogFactory from "../../../domain/LogFactory";
import * as O from "fp-ts/lib/Option";
import ProductDevelopmentRepository from "../../../domain/product/repository/ProductDevelopmentRepository";

export const ProductDevelopmentEndpoints = {
    byId: "FindProductDevelopmentById",
    search: "SearchProductDevelopments",
    create: "CreateProductDevelopment"
};

export class ProductDevelopmentResource {
    private readonly log = LogFactory.get(ProductDevelopmentResource.name);

    constructor(private service: ProductDevelopmentService,
                private repo: ProductDevelopmentRepository) {}

    search = (req: Request, res: Response, next): void => {
        this.log.info(`search ticket update collections request received: ${JSON.stringify(req.body)}`);
        translate.toSearchMethod(req).fold(
            err => {
                res.status(400);
                next(err);
            },
            method => {
                switch (method.name) {
                    case translate.searchMethod.findOneByTicketBoardKey:
                        this.repo.findOneByTicketBoardKey(method.params.get(translate.searchParam.ticketBoardKey)).run()
                            .then(ret => {
                                ret.fold(
                                    err => {
                                        res.status(400);
                                        next(err);
                                    },
                                    (optionalResult: O.Option<any>) => {
                                        res.status(201).json(optionalResult.isSome() ? optionalResult.value : {})
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

    byId = (req: Request, res: Response): void => {
        // use query service
        throw Error('not implemented')
    };

    create = (req: Request, res: Response, next): void => {
        this.log.info(`create product development request received: ${JSON.stringify(req.body)}`);
        translate.toCommand(req).fold(
            err => {
                res.status(400);
                next(err);
            },
            command => {
                switch (command.type) {
                    case CreateProjectFromTicketBoard.name:
                        this.service.createFromTicketBoard(command).run()
                            .then(ret => {
                                ret.fold(
                                    err => {
                                        res.status(400);
                                        next(err);
                                    },
                                    id => {
                                        res.status(201)
                                            .location(`/api/v1/productDevelopments/${id}`)
                                            .json(id)
                                    })
                            })
                            .catch((err) => {
                                res.status(400);
                                next(err);
                            });
                        return;
                    default:
                        res.status(400).json({reason: `${command.type} command not known`})
                }
            }
        )
    }
}
