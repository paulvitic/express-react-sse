import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionEnded extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly devProjectId: string){
        super(aggregate, aggregateId);
    }
}
