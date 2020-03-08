import {AbstractDomainEvent} from "../../DomainEvent";
import {ChangeLog} from "../service/TicketBoardIntegration";

export class TicketChanged extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly ticketExternalRef: number,
        readonly ticketKey: string,
        readonly changeLog: ChangeLog[]){
            super(aggregate, aggregateId);
    }
}
