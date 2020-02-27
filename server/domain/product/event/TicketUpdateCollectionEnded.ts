import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionEnded extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly devProjectId: string){
        super(aggregate, aggregateId, sequence);}
}
