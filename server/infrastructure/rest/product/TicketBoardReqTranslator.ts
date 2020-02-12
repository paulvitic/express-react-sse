import {Request} from 'express';
import CreateProjectFromTicketBoard from "../../../application/product/commands/CreateProjectFromTicketBoard";
import DeleteTicketBoardCommand from "../../../application/product/commands/DeleteTicketBoard";

// TODO also validation

type TicketBoardCommand = CreateProjectFromTicketBoard & DeleteTicketBoardCommand

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

