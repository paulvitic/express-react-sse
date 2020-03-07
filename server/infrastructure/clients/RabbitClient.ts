import amqp, {Channel, ConfirmChannel, Connection} from 'amqplib';
import LogFactory from "../../domain/LogFactory";
import * as TE from "fp-ts/lib/TaskEither";
import {pipe} from "fp-ts/lib/pipeable";

export type RabbitClientParams = {
    host: string,
    port:number,
    user: string,
    password: string,
    vhost: string
}

// if the connection is closed or fails to be established at all, we will reconnect
export default class RabbitClient {
    private readonly log = LogFactory.get(RabbitClient.name);
    private readonly url: string;
    private connection: Connection;

    private constructor(params: RabbitClientParams) {
        this.url = `amqp://${params.user}:${params.password}@${params.host}:${params.port}${params.vhost}`;
    }

    static init = (params: RabbitClientParams): Promise<RabbitClient> => {
        return new Promise<RabbitClient>((resolve, reject) => {
            let client = new RabbitClient(params);
            client.log.info(`initializing ${params.user}@${params.host}:${params.port}${params.vhost}`);
            client.connect().then(conn => {
                    client.connection = conn;
                    resolve(client);
                }).catch( err => {
                    reject(err)
                    //setTimeout(self.connect, 7000); // we can try reconnecting
                })
        });
    };

    connect = (): Promise<Connection> => {
        return new Promise<Connection>((resolve, reject) =>
            this.connectTask().run().then(conn =>
                conn.isRight() ? resolve(conn.value) : reject(conn.value)))
    };

    closeConnection = (): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            this.closeConnectionTask().run().then(res =>
                res.isRight() ? resolve(res.value): reject(res.value))
        });
    };

    createChannel = (exchange:string, confirm:boolean): Promise<Channel|ConfirmChannel>  => {
        return new Promise<Channel|ConfirmChannel>((resolve, reject) => {
            this.createChannelTask(exchange, confirm).run()
                .then( channel => channel.isRight() ? resolve(channel.value) : reject(channel.value))
                .catch( err => this.closeOnErr(err).then( closed => {
                    if (closed) this.log.info('connection closed');
                    reject(err);
                }))
        })
    };

    closeConnectionTask = (): TE.TaskEither<Error, boolean> => {
        return TE.tryCatch(() => this.connection.close().then(() => true),
            err => err as Error)
    };

    createChannelTask = (exchange:string, confirm:boolean): TE.TaskEither<Error, Channel | ConfirmChannel> => {
        return pipe(TE.tryCatch(() => confirm ?
            this.connection.createConfirmChannel().then(channel => channel) :
            this.connection.createChannel().then(channel => channel),
            err => err as Error),
            TE.chain(this.onChannelError),
            TE.chain(this.onChannelClose),
            TE.chain(channel => this.assertExchangeTask(channel, exchange))
        )
    };

    private connectTask = (): TE.TaskEither<Error, Connection> => {
        return pipe(
            TE.tryCatch(() => amqp.connect(this.url + '?heartbeat=60').then(conn => conn),err => err as Error),
            TE.chain(this.onConnectionError),
            TE.chain(this.onConnectionClose)
        )
    };

    private onConnectionError = (conn: Connection): TE.TaskEither<Error, Connection> => {
        return TE.taskEither.of(conn.on('error', err => {
            if (err.message !== 'Connection closing') this.log.error('conn error', err.message);
            return conn;
        }))
    };

    private onConnectionClose = (conn: Connection): TE.TaskEither<Error, Connection> => {
        return TE.taskEither.of(conn.on('close', () => {
            this.log.error('reconnecting');
            return conn;
        }))
    };

    private onChannelError = (channel: Channel): TE.TaskEither<Error, Channel> => {
        return TE.taskEither.of(channel.on('error', err => {
            this.log.error('channel error: ', err);
            return channel;
        }))
    };

    private onChannelClose = (channel: Channel): TE.TaskEither<Error, Channel> => {
        return TE.taskEither.of(channel.on('close', () => {
            this.log.info('channel closed');
            return channel;
        }))
    };

    private assertExchangeTask = (channel: Channel, exchange:string): TE.TaskEither<Error, Channel> => {
        return TE.tryCatch(
            () => channel.assertExchange(exchange,'fanout',{ durable: true })
                .then(exchangeAssert => {
                    this.log.debug(`exchange assert: ${JSON.stringify(exchangeAssert)}`);
                    return channel;
                }), err => err as Error);
    };

    closeOnErr = (err): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            if (!err) {
                resolve(false);
            } else {
                this.log.error(`error: `, err);
                this.connection.close().then(() => resolve(true));
            }
        })
    };

    /*onConnectionError = (conn: Connection): TE.TaskEither<Error, void> => {
        return TE.taskify(conn.on)("error")
    };*/
}




