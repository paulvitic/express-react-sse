import ExamplesService from '../../application/ExamplesService';
import {Request, RequestHandler, Response} from 'express';

export class ExamplesResource {

  constructor (private examplesService: ExamplesService){}

  all = (): RequestHandler => {
    return (req: Request, res: Response): void => {
      this.examplesService.all().then(r => res.json(r));
    }
  };

  byId = (): RequestHandler => {
    return (req: Request, res: Response): void => {
      const id = Number.parseInt(req.params['id']);
      this.examplesService.byId(id).then(r => {
        if (r) res.json(r);
        else res.status(404).end();
      });
    }
  };

  create = (): RequestHandler => {
    return (req: Request, res: Response): void => {
      this.examplesService.create(req.body.name).then(r =>
          res.status(201)
              .location(`/api/v1/examples/${r.id}`)
              .json(r),
      );
    }
  }
}
