import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionCompleted extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly ticketBoardKey: string,
        readonly completedDate: string){
        super(aggregate, aggregateId);
    }
}
