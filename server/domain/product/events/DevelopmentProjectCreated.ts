import {AbstractDomainEvent} from "../../DomainEvent";

export class DevelopmentProjectCreated extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number,
        readonly name: string){
        super(aggregate, aggregateId, sequence);}
}
