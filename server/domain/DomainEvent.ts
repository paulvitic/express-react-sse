export default interface DomainEvent {
    eventType(): string;
    aggregate(): string;
    aggregateId(): string;
    generatedOn(): Date;
}


export abstract class AbstractDomainEvent implements DomainEvent {
    private readonly _eventType: string;
    private readonly _aggregate: string;
    private readonly _aggregateId: string;
    private readonly _generatedOn: Date;

    constructor(_aggregate: string,
                _aggregateId: string) {
            this._eventType = this.constructor.name;
            this._aggregate = _aggregate;
            this._aggregateId = _aggregateId;
            this._generatedOn= new Date();
    }

    aggregate = (): string => {
        return this._aggregate;
    };

    aggregateId = (): string => {
        return this._aggregateId;
    };

    generatedOn = (): Date => {
        if (this._generatedOn) return this._generatedOn;
        throw Error
    };

    eventType = (): string =>{
        return this._eventType;
    };
}

export class EventRegistry {
    private static registry = new Map<string, any>();

    static addEventType = (eventType: string, claz: any) => {
        EventRegistry.registry.set(eventType, claz)
    };

    static fromJsonString = (jsonString: string): DomainEvent => {
        const partial = JSON.parse(jsonString);
        return EventRegistry.fromJsonObject(partial);
    };

    static fromJsonObject = (jsonObject: any): DomainEvent => {
        const eventType = EventRegistry.registry.get(jsonObject._eventType);
        if (eventType) {
            const event = new eventType(jsonObject._aggregate, jsonObject._aggregateId);
            Object.assign(event, jsonObject);
            return event
        } else {
            throw new Error(`${jsonObject._eventType} is not a registered event type.`)
        }
    }
}
