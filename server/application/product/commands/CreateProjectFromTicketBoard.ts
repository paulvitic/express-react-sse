import Command from "../../Command";

export class CreateProjectFromTicketBoard extends Command {
    constructor(readonly ticketBoardKey: string,
                readonly defaultStart: Date) {
        super(CreateProjectFromTicketBoard.name)
    }
}
