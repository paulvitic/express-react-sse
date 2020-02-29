import {AbstractDomainEvent} from "../../DomainEvent";

export class DevelopmentProjectCreated extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly name: string){
        super(aggregate, aggregateId);
    }
}
