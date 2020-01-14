import TicketBoardsService from '../../../application/product/TicketBoardsService';
import {Request, RequestHandler, Response} from 'express';

export class TicketBoardsResource {

  constructor (private examplesService: TicketBoardsService){}

  byId = (req: Request, res: Response): void => {
      const id = Number.parseInt(req.params['id']);
      this.examplesService.byId(id).then(r => {
        if (r) res.json(r);
        else res.status(404).end();
      });
  };

  create = (req: Request, res: Response): void => {
      this.examplesService.create(req.body.name)
          .then(r => res.status(201)
              .location(`/api/v1/examples/${r.id}`)
              .json(r),
      );
  }
}
