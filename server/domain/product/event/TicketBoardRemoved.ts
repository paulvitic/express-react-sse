import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketBoardRemoved extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string){
        super(aggregate, aggregateId);
    }
}

