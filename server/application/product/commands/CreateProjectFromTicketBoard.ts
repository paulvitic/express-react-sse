import Command from "../../Command";

export class CreateProjectFromTicketBoard extends Command {
    constructor(readonly ticketBoardKey: string) {
        super(CreateProjectFromTicketBoard.name)
    }
}
