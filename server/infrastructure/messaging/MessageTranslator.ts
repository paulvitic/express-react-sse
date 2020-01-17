import DomainEvent from "../../domain/DomainEvent";
import {Message} from "amqplib";
import {translateJsonString} from "../JsonEventTranslator";

type OutgoingMessage = {
    content: Buffer,
    options: {
        expiration?: string | number;
        userId?: string;
        CC?: string | string[];

        mandatory?: boolean;
        persistent?: boolean;
        deliveryMode?: boolean | number;
        BCC?: string | string[];

        contentType?: string;
        contentEncoding?: string;
        headers?: any;
        priority?: number;
        correlationId?: string;
        replyTo?: string;
        messageId?: string;
        timestamp?: number;
        type?: string;
        appId?: string;
    }
}

export function translateEvent(event: DomainEvent): Promise<OutgoingMessage> {
    return new Promise<OutgoingMessage>((resolve, reject) => {
        resolve({
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
        )
    })
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
