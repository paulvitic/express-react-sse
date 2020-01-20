import { Request, Response, NextFunction } from 'express';
import LogFactory from "./LogFactory";

const log = LogFactory.get("errorHandler");

export default function errorHandler(err, req: Request, res: Response, next: NextFunction) {
  log.error(`error while handing request ${req.url}`, err);
  res.status(res.statusCode || 500);
  res.json({message: err.message});
}

