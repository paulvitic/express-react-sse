import DomainEvent from "../domain/DomainEvent";

const registry = new Map<string, any>();

export function registerDomainEvent(eventType: string, claz: any){
    registry.set(eventType, claz)
}

export function translateJsonObject(partial: any): Promise<DomainEvent>{
    return new Promise<DomainEvent>((resolve, reject) => {
        try {
            const eventType = registry.get(partial._eventType);
            if (eventType) {
                const event = new eventType(partial._aggregate, partial._aggregateId);
                Object.assign(event, partial);
                resolve(event)
            } else {
                reject(new Error(`${partial._eventType} is not a registered event type.`));
            }
        } catch (err) {
            reject(err);
        }
    })
}

export function translateJsonString(jsonString: string): Promise<DomainEvent> {
    return new Promise<DomainEvent>((resolve, reject) => {
        translateJsonObject(JSON.parse(jsonString)).then((res => {
            resolve(res)
        })).catch(err => {
            reject(err)
        })
    })
}
