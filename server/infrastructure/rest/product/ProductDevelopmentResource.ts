import ProductDevelopmentService from '../../../application/product/ProductDevelopmentService';
import {Request, Response} from 'express';
import * as translate from "./ProductDevelopmentReqTranslator";
import {CreateProjectFromTicketBoard} from "../../../application/product/commands";
import LogFactory from "../../../domain/LogFactory";

export const ProductDevelopmentEndpoints = {
    byId: "FindProductDevelopmentById",
    create: "CreateProductDevelopment"
};

export class ProductDevelopmentResource {
    private readonly log = LogFactory.get(ProductDevelopmentResource.name);

    constructor(private service: ProductDevelopmentService) {}

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
                            .then(id => res.status(201)
                                .location(`/api/v1/developmentProjects/${id}`)
                                .json(id))
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
