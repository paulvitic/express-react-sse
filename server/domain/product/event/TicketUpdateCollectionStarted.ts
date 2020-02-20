import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionStarted extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly devProjectId: string,
        readonly from:Date,
        readonly to:Date){
        super(aggregate, aggregateId, sequence);}
}
