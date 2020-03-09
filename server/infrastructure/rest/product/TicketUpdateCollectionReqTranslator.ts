import {Request} from 'express';
import {
    CollectTicketUpdates,
    CreateProjectFromTicketBoard,
    RemoveTicketBoard
} from "../../../application/product/commands";
import * as E from "fp-ts/lib/Either";
import {throwError} from "fp-ts/lib/Exception";

// TODO also validation
type TicketUpdateCollectionCommand = CollectTicketUpdates

export function toCommand(req: Request): E.Either<Error, TicketUpdateCollectionCommand> {
    return E.tryCatch2v(() => {
        switch (req.method) {
            case 'POST':
                return new CollectTicketUpdates(req.body.productDevId);
            default:
                throwError(new Error('not implemented'))
        }
    }, err => err as Error)
}

