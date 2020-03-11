import {AbstractDomainEvent} from "../../DomainEvent";

export class ProductDevelopmentCreated extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly name: string,
        readonly startedOnDate: string){
        super(aggregate, aggregateId);
    }
}
