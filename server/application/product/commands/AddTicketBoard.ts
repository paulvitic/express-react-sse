import Command from "../../Command";

export default class AddTicketBoard extends Command {
    constructor(readonly name: string) {
        super(AddTicketBoard.name)
    }
}
