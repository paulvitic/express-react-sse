import {AbstractDomainEvent} from "../../DomainEvent";
import {TicketUpdateCollectionPeriod} from "../TicketUpdateCollection";

export class TicketUpdateCollectionStarted extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly ticketBoardKey: string,
        readonly fromDate: string,
        readonly toDate: string){
        super(aggregate, aggregateId);
    }
}
