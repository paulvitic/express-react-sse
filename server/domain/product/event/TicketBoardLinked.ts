import {AbstractDomainEvent} from "../../DomainEvent";
import TicketBoard from "../TicketBoard";

export class TicketBoardLinked extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly ticketBoard: TicketBoard){
        super(aggregate, aggregateId);
    }
}

