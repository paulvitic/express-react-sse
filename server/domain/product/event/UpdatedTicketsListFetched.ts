import {AbstractDomainEvent} from "../../DomainEvent";
import {UpdatedTicket} from "../service/TicketBoardIntegration";
import {TicketUpdateCollectionPeriod} from "../TicketUpdateCollection";

export class UpdatedTicketsListFetched extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly ticketBoardKey: string,
        readonly fromDate: string,
        readonly toDate: string,
        readonly updatedTickets: UpdatedTicket[]){
        super(aggregate, aggregateId,);
    }
}
