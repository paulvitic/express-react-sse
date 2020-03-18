import {AbstractDomainEvent} from "../../DomainEvent";
import {TicketChangeLog} from "../service/TicketBoardIntegration";

export class TicketChanged extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly prodDevStartedOn: string,
        readonly ticketRef: number,
        readonly ticketKey: string,
        readonly ticketChangeLog: TicketChangeLog){
            super(aggregate, aggregateId);
    }
}
