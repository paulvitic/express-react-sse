import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketUpdateCollectionStarted extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly prodDevStartedOn: string,
        readonly ticketBoardKey: string,
        readonly fromDate: string,
        readonly toDate: string){
        super(aggregate, aggregateId);
    }
}
