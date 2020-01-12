import EventBus, {EventHandler} from "../../domain/EventBus";
import DomainEvent from "../../domain/DomainEvent";
import EventStore from "../../domain/EventStore";
import LogFactory from "../context/LogFactory";
import RabbitClient from "../context/RabbitClient";
import {Channel, Message} from 'amqplib/callback_api';

const domainEventQueue = "domainEvents";

export default class RabbitEventBus implements EventBus {
    private readonly log = LogFactory.get(RabbitEventBus.name);
    private sendChannel: Channel;
    private subscriptions: Map<string, EventHandler[]>;
    private receiveChannel: Channel;

    constructor(
        private readonly rabbitClient: RabbitClient,
        private readonly store: EventStore
    ) {
        this.rabbitClient.createChannel(domainEventQueue)
            .then((channel) => {
                this.receiveChannel = channel;
                this.receiveChannel.consume(domainEventQueue, this.onMessage, { noAck: false });
                this.rabbitClient.createChannel(domainEventQueue)
                    .then((channel) => {
                        // TODO do we eed 2 channels? Test!!!
                        this.sendChannel = channel;
                    });
            });
    }

    publish = <T extends DomainEvent = DomainEvent>(event: T): Promise<boolean> => {
        this.log.info(`Publishing event type ${event.eventType}`);
        return new Promise<boolean>((resolve => {
            this.store.logEvent(event)
                .then((success) => {
                    if (success) {
                        resolve(this.sendChannel.sendToQueue(domainEventQueue, Buffer.from(JSON.stringify(event))))
                    } else {
                        resolve(false);
                    }
                });
        }))
    };

    subscribe = (eventType: string, handler: EventHandler): Promise<boolean> => {
        return new Promise<boolean>((resolve => {
            if (!this.subscriptions.get(eventType)) {
                this.subscriptions.set(eventType, new Array<EventHandler>())
            }
            this.subscriptions.get(eventType).push(handler);
            resolve(true);
        }))
    };

    onMessage = (msg:Message) => {
        this.log.info('msg [deliveryTag=' + msg.fields.deliveryTag + '] arrived');
        const self = this;
        this.emit(msg, function (ok) {
            self.log.info('sending Ack for msg');
            try {
                if (ok)
                    self.receiveChannel.ack(msg);
                else
                    self.receiveChannel.reject(msg, true);
            } catch (e) {
                self.rabbitClient.closeOnErr(e);
            }
        });
    };

    emit = (msg, ack) => {
        const msgStr = msg.content.toString();
        this.log.info('got msg %s', msgStr);
        const event = JSON.parse(msgStr);
        ack(true)
    }
}
