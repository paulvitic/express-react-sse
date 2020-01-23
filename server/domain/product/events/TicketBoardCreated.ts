import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketBoardCreated extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly externalId: number,
        readonly externalKey: string){
        super(aggregate, aggregateId, sequence);}
}
