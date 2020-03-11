import { Request, Response, NextFunction } from 'express';
import LogFactory from "../../domain/LogFactory";

export default function errorHandler(err:Error, req: Request, res: Response, next: NextFunction) {
  LogFactory.get("RequestErrorHandler").error(`error while handing request ${req.url}\n ${err.stack}`);
  res.status(res.statusCode || 500);
  res.json({name: err.name, message: err.message, stack: err.stack});
}

