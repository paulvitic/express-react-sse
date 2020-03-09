import {Request} from 'express';
import {
    CreateProjectFromTicketBoard,
    RemoveTicketBoard
} from "../../../application/product/commands";
import * as E from "fp-ts/lib/Either";
import {throwError} from "fp-ts/lib/Exception";

// TODO also validation
type TicketBoardCommand = CreateProjectFromTicketBoard & RemoveTicketBoard

export function toCommand(req: Request): E.Either<Error, TicketBoardCommand> {
    return E.tryCatch2v(() => {
        switch (req.method) {
            case 'POST':
                return new CreateProjectFromTicketBoard(req.body.key);
            default:
                throwError(new Error('not implemented'))
        }
    }, err => err as Error)
}

