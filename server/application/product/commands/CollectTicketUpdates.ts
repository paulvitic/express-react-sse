import Command from "../../Command";

export class CollectTicketUpdates extends Command {
    constructor(readonly prodDevId: string){
        super(CollectTicketUpdates.name)
    }
}
