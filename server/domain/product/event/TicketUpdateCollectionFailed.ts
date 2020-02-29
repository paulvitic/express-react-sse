import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionFailed extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly devProjectId: string,
        readonly ticketBoardKey: string,
        readonly processor: string,
        readonly reason: string){
        super(aggregate, aggregateId);
    }
}
