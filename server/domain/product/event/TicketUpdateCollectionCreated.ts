import {AbstractDomainEvent} from "../../DomainEvent";
import {TicketUpdateCollectionPeriod, TicketUpdateCollectionStatus} from "../TicketUpdateCollection";

export class TicketUpdateCollectionCreated extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly status: TicketUpdateCollectionStatus,
        readonly prodDevId: string,
        readonly ticketBoardKey: string,
        readonly fromDate: string,
        readonly toDate: string){
        super(aggregate, aggregateId);
    }
}
