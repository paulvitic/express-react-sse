import TicketBoardsService from '../../../application/product/TicketBoardsService';
import {Request, Response} from 'express';
import translateTicketBoardRequest from "./TicketBoardReqTranslator";
import AddTicketBoard from "../../../application/product/commands/AddTicketBoard";
import WinstonLogFactory from "../../context/WinstonLogFactory";

export const TicketBoardsEndpoints = {
    byId : "TicketBoardsById",
    create: "TicketBoardsCreate"
};

export class TicketBoardsResource {
    private readonly log = WinstonLogFactory.get(TicketBoardsResource.name);

  constructor (private service: TicketBoardsService){}

  byId = (req: Request, res: Response): void => {
      // use query service
      throw Error('not implemented')
  };

  create = (req: Request, res: Response, next): void => {
      this.log.info(`create ticket board request received: ${req.body}`);
      translateTicketBoardRequest(req)
          .then(command => {
              switch (command.type) {
                  case AddTicketBoard.name:
                      this.service.addTicketBoard(command)
                          .then(id => res.status(201)
                              .location(`/api/v1/ticketBoards/${id}`)
                              .json(id))
                          .catch((err) => {
                              res.status(400)
                              next(err);
                          });
                      return;
                  default:
                      res.status(400).json({reason: `${command.type} not known`})
              }
      })
  }
}
