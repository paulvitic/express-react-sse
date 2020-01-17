import {Request} from 'express';
import AddTicketBoard from "../../../application/product/commands/AddTicketBoard";
import DeleteTicketBoardCommand from "../../../application/product/commands/DeleteTicketBoard";

// TODO also validation

type TicketBoardCommand = AddTicketBoard & DeleteTicketBoardCommand

export default function translateTicketBoardRequest(req: Request): Promise<TicketBoardCommand> {
    return new Promise<TicketBoardCommand>((resolve, reject) => {
        switch (req.method) {
            case 'POST':
                resolve(new AddTicketBoard(req.body.name));
                return;
            default:
                reject(new Error('not implemented'))
        }
    })
}

