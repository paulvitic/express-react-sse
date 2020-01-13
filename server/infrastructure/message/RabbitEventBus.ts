import EventBus, {EventHandler} from "../../domain/EventBus";
import DomainEvent, {EventRegistry} from "../../domain/DomainEvent";
import EventStore from "../../domain/EventStore";
import LogFactory from "../context/LogFactory";
import RabbitClient from "../context/RabbitClient";
import {Channel, Message} from 'amqplib';

// each domain would have its own exchange
const sourceDomainExchange = "source_domain";

export default class RabbitEventBus implements EventBus {
    private readonly log = LogFactory.get(RabbitEventBus.name);
    private sendChannel: Channel;
    private receiveChannel: Channel;
    private subscribers: Map<string, EventHandler[]>;

    private constructor(
        private readonly rabbitClient: RabbitClient,
        private readonly store: EventStore
    ) {}

    static init = (client: RabbitClient, store: EventStore): Promise<RabbitEventBus> => {
        let eventBus = new RabbitEventBus(client, store);
        return new Promise<RabbitEventBus>((resolve, reject) => {
            eventBus.rabbitClient.createTopic(sourceDomainExchange)
                .then((receiveChannel) => {
                    receiveChannel.assertQueue(`to_target_domain_events_of_all_aggregates`, { exclusive: true})
                        .then((queueAssert) => {
                            eventBus.log.info(`queue assert: ${JSON.stringify(queueAssert)}`);
                            // we can bind to multiple queues with different routing keys, but here we only use one
                            receiveChannel.bindQueue(queueAssert.queue,  sourceDomainExchange, "targetDomain.*")
                                .then(()=> {
                                    eventBus.receiveChannel = receiveChannel;
                                    eventBus.receiveChannel.consume(queueAssert.queue, eventBus.onMessage, { noAck: false })
                                        .then((consume) => {
                                            eventBus.log.info(`consume tag: ${JSON.stringify(consume)}`);

                                            eventBus.rabbitClient.createTopic(sourceDomainExchange)
                                                .then((sendChannel) => {
                                                    eventBus.sendChannel = sendChannel;
                                                    resolve(eventBus)
                                                });
                                        });
                                })
                        });
                });
        })
    };

    publish = <T extends DomainEvent = DomainEvent>(event: T): Promise<boolean> => {
        this.log.info(`Publishing event type ${event.eventType}`);
        return new Promise<boolean>((resolve, reject) => {
            let published: boolean = this.sendChannel.publish(
                sourceDomainExchange,
                `targetDomain.${event.aggregate()}`,
                Buffer.from(JSON.stringify(event)));

            this.store.logEvent(event, published)
                .then((success) => {
                    if (success) {
                        resolve(success)
                    } else {
                        // TODO throw error
                        resolve(false);
                    }
                }).catch((err) => {
                    reject(err)
            });
        })
    };

    subscribe = (eventType: string, handler: EventHandler): Promise<boolean> => {
        return new Promise<boolean>((resolve => {
            if (!this.subscribers.get(eventType)) {
                this.subscribers.set(eventType, new Array<EventHandler>())
            }
            this.subscribers.get(eventType).push(handler);
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
                self.rabbitClient.closeOnErr(e)
                    .then((closed) => {
                        if (closed) self.log.info('connection closed');
                });
            }
        });
    };

    emit = (msg, ack) => {
        this.log.info(`got msg: ${JSON.stringify(msg)}`);
        const msgStr = msg.content.toString();
        // TODO add a translator from message to Domain Event as an anti corruption layer
        const event = EventRegistry.fromJsonString(msgStr);
        this.subscribers.get(event.eventType)
            .forEach( (handle) => {
                handle(event)
            }
        );
        ack(true)
    }
}
