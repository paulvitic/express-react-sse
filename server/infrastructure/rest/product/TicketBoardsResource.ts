import TicketBoardsService from '../../../application/product/TicketBoardsService';
import {Request, Response} from 'express';
import translateTicketBoardRequest from "./TicketBoardReqTranslator";
import AddTicketBoard from "../../../application/product/commands/AddTicketBoard";

export class TicketBoardsResource {

  constructor (private service: TicketBoardsService){}

  byId = (req: Request, res: Response): void => {
      // use query service
      throw Error('not implemented')
  };

  create = (req: Request, res: Response): void => {
      translateTicketBoardRequest(req)
          .then(command => {
              switch (command.type) {
                  case AddTicketBoard.name:
                      this.service.addTicketBoard(command)
                          .then(id => res.status(201)
                              .location(`/api/v1/ticketBoards/${id}`)
                              .json(id))
                          .catch((err) => {
                              throw new Error(err);
                          })
                          .catch()
              }
      })
  }
}
