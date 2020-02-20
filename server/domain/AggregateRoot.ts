import DomainEvent from "./DomainEvent";
import * as TE from "fp-ts/lib/TaskEither";
import {array} from "fp-ts/lib/Array";
import {pipe} from "fp-ts/lib/pipeable";
import * as E from "fp-ts/lib/Either";
import * as M from 'fp-ts/lib/Monoid'
import DomainEntity from "./DomainEntity";

export default abstract class AggregateRoot extends DomainEntity {
    private readonly _domainEvents: DomainEvent[] = new Array<DomainEvent>();
    private lastEventSequence: number = 0;

    protected constructor(id: string,
                          private _active?: boolean) {
        super(id);
        if (_active===undefined) this._active = true;
    }

    static fromEvents(id: string, events: DomainEvent[]): AggregateRoot {
        throw Error;
    }

    get isActive(): boolean {
        return this._active;
    }

    get type() {
        return typeof this;
    }

    get domainEvents() {
        return this._domainEvents
    }

    clearDomainEvents(): E.Either<Error, void> {
        return E.tryCatch(() => {
            this._domainEvents.length = 0;
            }, error => error as Error
        )
    }

    nextEventSequence(): number {
        return this.lastEventSequence + 1;
    }

    protected recordEvent = (event: DomainEvent): E.Either<Error, number> => {
        return E.tryCatch(() => this.domainEvents.push(event), error => error as Error)
    };

    protected assertEventSequence(eventSequence: number): E.Either<Error, number> {
        return pipe(
            E.either.of(eventSequence),
            E.filterOrElse((eventSequence) => eventSequence === this.lastEventSequence + 1,
                () => new Error(`Expected event sequence was ${this.lastEventSequence + 1} but got ${eventSequence}`)),
            E.map((eventSequence) => this.lastEventSequence = eventSequence)
        )
    }
}
