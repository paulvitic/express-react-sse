import Command from "../../Command";

export default class CreateProjectFromTicketBoard extends Command {
    constructor(readonly ticketBoardKey: string) {
        super(CreateProjectFromTicketBoard.name)
    }
}
