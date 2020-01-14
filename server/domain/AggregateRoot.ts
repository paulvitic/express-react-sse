import DomainEvent from "./DomainEvent";
import Identity from "./Identity";

export default abstract class AggregateRoot {
    private readonly aggregateId: string;
    private readonly aggregateType: string;
    private lastEventSequence: number;

    private readonly domainEvents: DomainEvent[] = new Array<DomainEvent>();

    protected constructor(id?: string) {
        this.aggregateId = id ? id : Identity.generate().id;
        this.aggregateType = this.constructor.name;
    }

    protected static fromEvents(id: string, events: DomainEvent[]): AggregateRoot {
        throw Error;
    }

    get id() {
        return this.aggregateId;
    }

    get type() {
        return this.aggregateType;
    }

    publishEventsUsing(publisher: (event: DomainEvent) => void) {
        let nextEvent = this.domainEvents.pop();
        while (nextEvent) {
            publisher(nextEvent);
            nextEvent = this.domainEvents.pop();
        }
    }

    protected recordEvent(event: DomainEvent): void {
        this.domainEvents.push(event);
    }
}
