import {AbstractDomainEvent} from "../../DomainEvent";
import TicketBoard from "../TicketBoard";

export class TicketBoardLinked extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly ticketBoardId: string,
        readonly ticketBoardKey: string,
        readonly ticketBoardRef: number,
        readonly prodDevStartDate: string){
        super(aggregate, aggregateId);
    }
}

