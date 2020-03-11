import {AbstractDomainEvent} from "../../DomainEvent";
import TicketBoard from "../TicketBoard";

export class TicketBoardRemoved extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string){
        super(aggregate, aggregateId);
    }
}

