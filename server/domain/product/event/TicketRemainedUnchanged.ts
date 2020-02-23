import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketRemainedUnchanged extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number){
        super(aggregate, aggregateId, sequence);}
}
