import EventBus from "../../domain/EventBus";
import DomainEvent from "../../domain/DomainEvent";
import EventStore from "../../domain/EventStore";
import RabbitClient from "../clients/RabbitClient";
import {Channel, ConfirmChannel, Message} from 'amqplib';
import * as translate from "./MessageTranslator";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import * as E from 'fp-ts/lib/Either'
import LogFactory from "../../domain/LogFactory";
import {array} from "fp-ts/lib/Array";
import EventListener from "../../domain/EventListener";
import * as M from "fp-ts/lib/Monoid";
import AggregateRoot from "../../domain/AggregateRoot";

export type OutgoingMessage = {
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

// each domain would have its own exchange
const sourceDomainExchange = "source_domain";

// the queue to receive messages
const consumeQueueName = 'to_target_domain_events_of_all_aggregates';

export default class RabbitEventBus implements EventBus {
    private readonly log = LogFactory.get(RabbitEventBus.name);
    private sendChannel: ConfirmChannel;
    private receiveChannel: Channel;
    private subscribers: Map<string, EventListener[]> = new Map<string, EventListener[]>();

    private constructor(
        private readonly rabbitClient: RabbitClient,
        private readonly store: EventStore
    ) {}

    static init = async (client: RabbitClient, store: EventStore): Promise<RabbitEventBus> => {
        return new Promise<RabbitEventBus>(async (resolve, reject) => {
            const eventBus = new RabbitEventBus(client, store);
            try {
                await pipe(
                    eventBus.createSendChannel(sourceDomainExchange),
                    TE.chain(() => eventBus.createReceiveChannel(sourceDomainExchange)),
                    TE.chain(() => eventBus.createQueue(consumeQueueName)),
                    TE.chainFirst(queueInfo => TE.rightIO(eventBus.log.io.debug(`queue info ${JSON.stringify(queueInfo)}`))),
                    TE.chain(eventBus.bindToQueue),
                    TE.chain(eventBus.consumeFromQueue)
                ).run();
                resolve(eventBus)
            } catch (e) {
                reject(e);
            }
        })
    };

    publishEvent = <T extends DomainEvent = DomainEvent>(event: T): TE.TaskEither<Error, boolean> => {
        this.log.debug(`publishing ${event.eventType}`);
        return pipe(
            TE.fromEither(translate.toOutgoingMessage(event)),
            TE.chain(this.send),
            TE.chain(sent => this.store.logEvent(event, sent)),
            TE.chainFirst(() => TE.rightIO(this.log.io.info(`${JSON.stringify(event, null, 0)}`))),
        )
    };

    publishEventsOf = (aggregate: AggregateRoot): TE.TaskEither<Error, boolean> => {
        return pipe(
            array.traverse(TE.taskEither)(aggregate.domainEvents, event => this.publishEvent(event)),
            TE.filterOrElse(
                deliveries => M.fold(M.monoidAll)(deliveries),
                () => new Error("Not all events are delivered")),
            TE.chain(() => TE.fromEither(aggregate.clearDomainEvents()))
        );
    };

    subscribe = (listener: EventListener, eventTypes: string[]): void => {
        eventTypes.forEach(eventType => this.registerListener(listener, eventType))
    };

    private registerListener = (listener: EventListener, eventType: string): void => {
        if (!this.subscribers.get(eventType)) {
            this.subscribers.set(eventType, new Array<EventListener>())
        }
        this.subscribers.get(eventType).push(listener);
    };

    private send = ({content, options}: OutgoingMessage): TE.TaskEither<Error, boolean> => {
        return TE.tryCatch(() => new Promise<boolean>( resolve => {
            this.sendChannel.publish(sourceDomainExchange, '', content, options);
            this.sendChannel.waitForConfirms().then(_ => {
                resolve(true)
            }).catch(_ =>
                resolve(false)
            )
        }), err => err as Error)
    };

    private createSendChannel(exchange: string): TE.TaskEither<Error, ConfirmChannel> {
        return pipe(
            this.rabbitClient.createChannelTask(exchange, true),
            TE.chain(channel => {
                this.sendChannel = channel as ConfirmChannel;
                return TE.taskEither.of(this.sendChannel);
            })
        )
    }

    private createReceiveChannel(exchange: string): TE.TaskEither<Error, Channel> {
        return pipe(
            this.rabbitClient.createChannelTask(exchange, false),
            TE.chain(channel => {
                this.receiveChannel = channel as ConfirmChannel;
                return TE.taskEither.of(this.receiveChannel);
            })
        )
    }

    private createQueue(queueName: string): TE.TaskEither<Error, string> {
        return TE.tryCatch( () =>
                this.receiveChannel.assertQueue(queueName, { exclusive: false})
                    .then(queueInfo => queueInfo.queue),
            err => err as Error)
    };

    private bindToQueue = (queueName: string): TE.TaskEither<Error, string> => {
        return TE.tryCatch( () =>
                this.receiveChannel.bindQueue(queueName, sourceDomainExchange, '')
                    .then(() => queueName),
            err => err as Error)
    };

    private consumeFromQueue = (queueName: string): TE.TaskEither<Error, string> => {
        return TE.tryCatch( () =>
            this.receiveChannel.consume(queueName, this.onMessage, { noAck: false })
                .then(consumeInfo => {
                    this.log.debug(`consume info ${JSON.stringify(consumeInfo)}`);
                    return consumeInfo.consumerTag;
                }), err => err as Error)
    };

    private onMessage = (msg: Message) => {
        this.log.debug(`got msg ${JSON.stringify(msg)}`);
        pipe(
            translate.toDomainEvent(msg),
            E.chainFirst(event => E.either.of(this.log.io.info(`received ${event.eventType}`))),
            E.chain(event => array.map(this.subscribersOf(event), subscriber => this.deliver(subscriber, event))
                .reduceRight((previous, current) => previous.chain(() => current), E.right(null)))
        ).fold(err => {
            this.log.debug(`rejecting the message ${err.message}`);
            this.receiveChannel.reject(msg, false);
        }, () => {
            this.log.debug(`acknowledging the message`);
            this.receiveChannel.ack(msg);
        });
    };

    private deliver(listener: EventListener, event: DomainEvent): E.Either<Error, void> {
        this.log.debug(`delivering ${event.eventType} to ${listener}`);
        return E.tryCatch2v(() => {
                listener.onEvent(event)
                    // .then( processed => {
                    //     if (!processed) throw new Error("could not process")
                    // })
                    .catch(e => {throw e as Error});
            }, err => err as Error)
    }

    private subscribersOf = (event: DomainEvent): EventListener[] => {
        return O.fromNullable(this.subscribers.get(event.eventType)).getOrElse([])
    };
}


