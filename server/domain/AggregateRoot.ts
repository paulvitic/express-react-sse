import DomainEvent from "./DomainEvent";
import * as TE from "fp-ts/lib/TaskEither";
import {array} from "fp-ts/lib/Array";
import {pipe} from "fp-ts/lib/pipeable";
import * as E from "fp-ts/lib/Either";
import * as M from 'fp-ts/lib/Monoid'



export default abstract class AggregateRoot {
    private readonly aggregateId: string;

    private readonly domainEvents: DomainEvent[] = new Array<DomainEvent>();
    private exists: boolean = true; // switch to false when soft deleted
    private lastEventSequence: number = 0;

    protected constructor(id: string) {
        this.aggregateId = id;
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

    publishEventsUsing(publisher: (event: DomainEvent) => TE.TaskEither<Error, boolean>):
        TE.TaskEither<Error, void> {
        return pipe(
            array.traverse(TE.taskEither)(this.domainEvents, (event) => publisher(event)),
            TE.chain((deliveries) => TE.fromEither(this.assertAllDelivered(deliveries))),
        )
    }

    private assertAllDelivered = (deliveries: boolean[]): E.Either<Error, void> => {
        let allDelivered = M.fold(M.monoidAll)(deliveries);
        // let allDelivered = deliveries.every(delivered => delivered===true);
        return E.tryCatch(
            () => {if (!allDelivered) throw new Error("Not all events are delivered")},
            e => (e instanceof Error ? e : new Error('Unknown error'))
        )
        // TODO you can remove the events here
        //return allDelivered ? E.right() : E.left(new Error('Not all events are delivered'))
    }
}
