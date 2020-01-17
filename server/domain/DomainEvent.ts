export default interface DomainEvent {
    eventType: string
    aggregate: string
    aggregateId: string
    sequence: number
    generatedOn: Date
}

export abstract class AbstractDomainEvent implements DomainEvent {
    private readonly _eventType: string;
    private readonly _generatedOn: Date;

    protected constructor(private readonly _aggregate: string,
                          private readonly _aggregateId: string,
                          private readonly _sequence: number
    ) {
            this._eventType = this.constructor.name;
            this._generatedOn= new Date();
    }

    get eventType(): string {
        return this._eventType;
    }

    get aggregate(): string {
        return this._aggregate;
    };

    get aggregateId(): string {
        return this._aggregateId;
    };

    get sequence(): number {
        return this._sequence;
    };

    get generatedOn(): Date {
        if (this._generatedOn) return this._generatedOn;
        throw Error
    };
}
