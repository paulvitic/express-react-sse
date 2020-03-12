import {AbstractDomainEvent} from "../../server/domain/DomainEvent";

export const AGGREGATE_TYPE_FIXTURE = "TestAggregate";
export const AGGREGATE_ID_FIXTURE = "aggregate-id";
export const EVENT_PAYLOAD_FIXTURE = "payload";

export class MockDomainEvent extends AbstractDomainEvent{
    constructor(aggregate: string,
                aggregateId: string,
                public mockPayload: string){
        super(aggregate, aggregateId);
    }
}

export const DOMAIN_EVENT_FIXTURE = new MockDomainEvent(
    AGGREGATE_TYPE_FIXTURE,
    AGGREGATE_ID_FIXTURE,
    EVENT_PAYLOAD_FIXTURE
);
