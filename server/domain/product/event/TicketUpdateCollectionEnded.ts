import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionEnded extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string){
        super(aggregate, aggregateId);
    }
}
