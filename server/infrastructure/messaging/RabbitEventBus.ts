import EventBus, {EventHandler} from "../../domain/EventBus";
import DomainEvent from "../../domain/DomainEvent";
import EventStore from "../../domain/EventStore";
import LogFactory from "../context/LogFactory";
import RabbitClient from "../clients/RabbitClient";
import {Channel, Message} from 'amqplib';
import {translateMessage, translateEvent} from "./MessageTranslator";

// each domain would have its own exchange
const sourceDomainExchange = "source_domain";

// the queue to receive messages
const consumeQueueName = 'to_target_domain_events_of_all_aggregates';

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
        let {receiveChannel, sendChannel} = eventBus;
        return new Promise<RabbitEventBus>(async (resolve, reject) => {
            try {
                // create a separate channel to send
                sendChannel =  await eventBus.rabbitClient.createChannel(sourceDomainExchange);

                // create a channel to receive
                receiveChannel = await eventBus.rabbitClient.createChannel(sourceDomainExchange);

                // create a named non-exclusive queue so other clients can connect as well and bind to it
                let queueInfo = await receiveChannel.assertQueue(consumeQueueName, { exclusive: false});
                eventBus.log.info(`queue info: ${JSON.stringify(queueInfo)}`);
                await receiveChannel.bindQueue(queueInfo.queue,  sourceDomainExchange, '');

                // start consuming from queue
                let consumeInfo = receiveChannel.consume(queueInfo.queue, eventBus.onMessage, { noAck: false });
                eventBus.log.info(`consume info: ${JSON.stringify(consumeInfo)}`);

                resolve(eventBus)
            } catch (e) {
                reject(e);
            }
        })
    };

    publish = <T extends DomainEvent = DomainEvent>(event: T): Promise<boolean> => {
        this.log.info(`Publishing event type ${event.eventType}`);
        return new Promise<boolean>((resolve, reject) => {
            translateEvent(event).then(({content, options}) => {
                let published: boolean = this.sendChannel.publish(
                    sourceDomainExchange,
                    '',
                    content,
                    options);

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

            }).catch(err => {
                reject(err)
            })
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

    onMessage = (msg: Message) => {
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
        translateMessage(msg)
            .then((event) => {
                this.subscribers
                    .get(event.eventType)
                    .forEach((handle) => { handle(event)});
                });
                ack(true)
            .catch(err => {
                this.log.error('error while processing received message', err);
                ack(true)
            })
    }
}
