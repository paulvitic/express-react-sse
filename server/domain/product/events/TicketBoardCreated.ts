import {AbstractDomainEvent} from "../../DomainEvent";

export class TicketBoardCreated extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly externalId: number,
        readonly externalKey: string,
        readonly projectCategory: {id: number, name: string, description: string }){
        super(aggregate, aggregateId, sequence);}
}

