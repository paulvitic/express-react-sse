import Command from "../../Command";

export class CollectTicketUpdates extends Command {
    constructor(readonly devProjectId: string){
        super(CollectTicketUpdates.name)
    }
}
