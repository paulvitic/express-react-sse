import {Request} from 'express';
import {
    CreateProjectFromTicketBoard,
    RemoveTicketBoard
} from "../../../application/product/commands";
import * as E from "fp-ts/lib/Either";
import {throwError} from "fp-ts/lib/Exception";

// TODO also validation
type TicketBoardCommand = CreateProjectFromTicketBoard & RemoveTicketBoard

export const searchParam = {
    ticketBoardKey: "ticketBoardKey"
};

export const searchMethod = {
    findOneByTicketBoardKey: "findOneByTicketBoardKey"
};

export function toSearchMethod(req: Request): E.Either<Error, {name: string, params: Map<string, any>}> {
    return E.tryCatch2v(() => {
        let ticketBoardKey = req.query.ticketBoardKey;
        let params = new Map<string, any>();
        params.set(searchParam.ticketBoardKey, ticketBoardKey);
        return {name : searchMethod.findOneByTicketBoardKey , params}

    }, err => err as Error)
}

export function toCommand(req: Request): E.Either<Error, TicketBoardCommand> {
    return E.tryCatch2v(() => {
        switch (req.method) {
            case 'POST':
                return new CreateProjectFromTicketBoard(req.body.ticketBoardKey, req.body.defaultStart);
            default:
                throwError(new Error('not implemented'))
        }
    }, err => err as Error)
}


