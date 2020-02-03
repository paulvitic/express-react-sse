import DomainEvent from "../../domain/DomainEvent";
import {Message} from "amqplib";
import {translateJsonString} from "../JsonEventTranslator";
import * as E from "fp-ts/lib/Either"
import {OutgoingMessage} from "./RabbitEventBus";

export function translateEvent(event: DomainEvent): E.Either<Error, OutgoingMessage> {
    return E.tryCatch(() => {
          return {
            content: Buffer.from(JSON.stringify(event)),
            options: {
                headers: {
                    aggregate: event.aggregate,
                    aggregateId: event.aggregateId,
                    sequence: event.sequence,
                    generatedOn: event.generatedOn
                },
                type: event.eventType
            }
          }
    }, reason => new Error(String(reason)))
}


export function translateMessage(msg:Message): Promise<DomainEvent> {
    return new Promise<DomainEvent>((resolve, reject) => {
        translateJsonString(msg.content.toString()).then(event => {
            resolve(event)
        }).catch(err => {
            reject(err)
        })
    })
}
