import DomainEvent from "./DomainEvent";
import Identity from "./Identity";

export default abstract class AggregateRoot {
    private readonly aggregateId: string;

    private readonly domainEvents: DomainEvent[] = new Array<DomainEvent>();
    private exists: boolean = true; // switch to false when soft deleted
    private lastEventSequence: number = 0;

    protected constructor(id?: string) {
        this.aggregateId = id ? id : Identity.generate();
    }

    static fromEvents(id: string, events: DomainEvent[]): AggregateRoot {
        throw Error;
    }

    get id() {
        return this.aggregateId;
    }

    get type() {
        return typeof this;
    }

    protected recordEvent(event: DomainEvent): void {
        this.domainEvents.push(event);
    }

    protected nextEventSequence(): number{
        return this.lastEventSequence + 1;
    }

    protected assertEventSequence(eventSequence: number) {
        if (eventSequence === this.lastEventSequence + 1) {
            this.lastEventSequence = eventSequence
        } else {
            throw new Error(`Expected event sequence was ${this.lastEventSequence + 1} but got ${eventSequence}`)
        }
    }

    publishEventsUsing(publisher: (event: DomainEvent) => void) {
        let nextEvent = this.domainEvents.pop();
        while (nextEvent) {
            publisher(nextEvent);
            nextEvent = this.domainEvents.pop();
        }
    }
}
