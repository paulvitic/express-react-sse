import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketRemainedUnchanged extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly devProjectId: string,
        readonly ticketExternalRef: number,
        readonly ticketKey: string){
        super(aggregate, aggregateId);
    }
}
