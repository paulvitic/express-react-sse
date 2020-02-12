import {AbstractDomainEvent} from "../../DomainEvent";
import TicketBoard from "../TicketBoard";

export class TicketBoardLinked extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly ticketBoard: TicketBoard){
        super(aggregate, aggregateId, sequence);}
}

