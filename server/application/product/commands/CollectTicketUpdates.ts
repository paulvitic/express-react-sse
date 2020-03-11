import Command from "../../Command";

export class CollectTicketUpdates extends Command {
    constructor(
        readonly prodDevId: string,
        readonly defaultFrom: Date){
        super(CollectTicketUpdates.name)
    }
}
