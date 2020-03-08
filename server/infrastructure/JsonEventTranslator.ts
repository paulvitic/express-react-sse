import DomainEvent from "../domain/DomainEvent";
import * as E from "fp-ts/lib/Either"
import {pipe} from "fp-ts/lib/pipeable";

const registry = new Map<string, any>();

export function registerDomainEvent(eventType: string, claz: any){
    registry.set(eventType, claz)
}

export function fromJsoneObject(partial: any):  E.Either<Error, DomainEvent> {
    return E.tryCatch2v(() => {
        const eventType = registry.get(partial._eventType);
        const event = new eventType(partial._aggregate, partial._aggregateId);
        Object.assign(event, partial);
        return event;
    }, reason => new Error(String(reason)))
}

export function fromJsonString(jsonString: string): E.Either<Error, DomainEvent> {
    return pipe(
        E.tryCatch2v(() => JSON.parse(jsonString), err => err as Error),
        E.chain(fromJsoneObject)
    )
}
