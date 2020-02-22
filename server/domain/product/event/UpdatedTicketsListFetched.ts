import {AbstractDomainEvent} from "../../DomainEvent";
import {UpdatedTicket} from "../service/TicketBoardIntegration";

export class UpdatedTicketsListFetched extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly devProjectId: string,
        readonly ticketBoardKey: string,
        readonly updatedTickets: UpdatedTicket[]){
        super(aggregate, aggregateId, sequence);}
}
