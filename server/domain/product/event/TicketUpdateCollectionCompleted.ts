import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionCompleted extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string){
        super(aggregate, aggregateId);
    }
}
