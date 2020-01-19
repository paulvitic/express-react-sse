import Command from "../../Command";

export default class AddTicketBoard extends Command {
    constructor(readonly key: string) {
        super(AddTicketBoard.name)
    }
}
