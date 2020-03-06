import {Request} from 'express';
import {
    CreateProjectFromTicketBoard,
    RemoveTicketBoard
} from "../../../application/product/commands";

// TODO also validation
type TicketBoardCommand = CreateProjectFromTicketBoard & RemoveTicketBoard

export default function translateTicketBoardRequest(req: Request): Promise<TicketBoardCommand> {
    return new Promise<TicketBoardCommand>((resolve, reject) => {
        switch (req.method) {
            case 'POST':
                resolve(new CreateProjectFromTicketBoard(req.body.key));
                return;
            default:
                reject(new Error('not implemented'))
        }
    })
}

