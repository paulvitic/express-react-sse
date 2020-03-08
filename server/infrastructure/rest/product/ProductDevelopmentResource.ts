import ProductDevelopmentService from '../../../application/product/ProductDevelopmentService';
import {Request, Response} from 'express';
import translateTicketBoardRequest from "./TicketBoardReqTranslator";
import {CreateProjectFromTicketBoard} from "../../../application/product/commands";
import LogFactory from "../../../domain/LogFactory";

export const ProductDevelopmentEndpoints = {
    byId: "ProductDevelopmentById",
    create: "ProductDevelopmentCreate"
};

export class ProductDevelopmentResource {
    private readonly log = LogFactory.get(ProductDevelopmentResource.name);

    constructor(private service: ProductDevelopmentService) {}

    byId = (req: Request, res: Response): void => {
        // use query service
        throw Error('not implemented')
    };

    create = (req: Request, res: Response, next): void => {
        this.log.info(`create development project request received: ${JSON.stringify(req.body)}`);
        translateTicketBoardRequest(req)
            .then(command => {
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
                        res.status(400).json({reason: `${command.type} not known`})
                }
            })
    }
}
