import DevelopmentProjectService from '../../../application/product/DevelopmentProjectService';
import {Request, Response} from 'express';
import translateTicketBoardRequest from "./TicketBoardReqTranslator";
import CreateProjectFromTicketBoard from "../../../application/product/commands/CreateProjectFromTicketBoard";
import LogFactory from "../../../domain/LogFactory";

export const TicketBoardsEndpoints = {
    byId : "TicketBoardsById",
    create: "TicketBoardsCreate"
};

export class TicketBoardsResource {
    private readonly log = LogFactory.get(TicketBoardsResource.name);

  constructor (private service: DevelopmentProjectService){}

  byId = (req: Request, res: Response): void => {
      // use query service
      throw Error('not implemented')
  };

  create = (req: Request, res: Response, next): void => {
      this.log.info(`create ticket board request received: ${req.body}`);
      translateTicketBoardRequest(req)
          .then(command => {
              switch (command.type) {
                  case CreateProjectFromTicketBoard.name:
                      this.service.createFromTicketBoard(command).run()
                          .then(id => res.status(201)
                              .location(`/api/v1/ticketBoards/${id}`)
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
