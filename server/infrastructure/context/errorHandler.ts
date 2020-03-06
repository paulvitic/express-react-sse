import { Request, Response, NextFunction } from 'express';
import LogFactory from "../../domain/LogFactory";

export default function errorHandler(err, req: Request, res: Response, next: NextFunction) {
  LogFactory.get("errorHandler").error(`error while handing request ${req.url}`, err);
  res.status(res.statusCode || 500);
  res.json({message: err.message});
}

