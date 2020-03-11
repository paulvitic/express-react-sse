import DomainEvent from "./DomainEvent";
import * as TE from "fp-ts/lib/TaskEither";
import {array} from "fp-ts/lib/Array";
import {pipe} from "fp-ts/lib/pipeable";
import * as E from "fp-ts/lib/Either";
import * as M from 'fp-ts/lib/Monoid'
import DomainEntity from "./DomainEntity";

export default abstract class AggregateRoot extends DomainEntity {
    private readonly _domainEvents: DomainEvent[] = new Array<DomainEvent>();

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

    clearDomainEvents(): E.Either<Error, boolean> {
        return E.tryCatch(() => {
            this._domainEvents.length = 0;
            return true;
            }, error => error as Error
        )
    }
    
    protected recordEvent = (event: DomainEvent): E.Either<Error, number> => {
        return E.tryCatch(() => this.domainEvents.push(event), error => error as Error)
    };
}
