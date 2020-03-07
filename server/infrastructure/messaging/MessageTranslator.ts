import DomainEvent from "../../domain/DomainEvent";
import {Message} from "amqplib";
import * as translate from "../JsonEventTranslator";
import * as E from "fp-ts/lib/Either"
import {OutgoingMessage} from "./RabbitEventBus";

export function toOutgoingMessage(event: DomainEvent): E.Either<Error, OutgoingMessage> {
    return E.tryCatch2v(() => {
          return {
            content: Buffer.from(JSON.stringify(event)),
            options: {
                headers: {
                    aggregate: event.aggregate,
                    aggregateId: event.aggregateId,
                    generatedOn: event.generatedOn
                },
                type: event.eventType
            }
          }
    }, reason => new Error(String(reason)))
}

export function toDomainEvent(msg:Message): E.Either<Error, DomainEvent> {
    return translate.fromJsonString(msg.content.toString());
}
