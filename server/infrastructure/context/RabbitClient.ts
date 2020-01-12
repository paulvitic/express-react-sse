import amqp, {Channel, Connection} from 'amqplib';
import LogFactory from "./LogFactory";

// if the connection is closed or fails to be established at all, we will reconnect
export default class RabbitClient {
    private readonly log = LogFactory.get(RabbitClient.name);
    private readonly rabbitMqUrl: string;
    private amqpConn: Connection;

    constructor(private readonly host: string,
                private readonly port:number,
                private readonly user: string,
                password: string,
                private readonly vhost: string
    ) {
        this.rabbitMqUrl = `amqp://${user}:${password}@${host}:${port}${vhost}`;
    }

    init = (): Promise<RabbitClient> => {
        this.log.info(`initializing ${this.user}@${this.host}:${this.port}${this.vhost}`);
        return new Promise<RabbitClient>((resolve, reject) => {
            let self = this;
            amqp.connect(this.rabbitMqUrl + '?heartbeat=60')
                .then((conn) => {
                    conn.on('error', function (err) {
                        if (err.message !== 'Connection closing') {
                            self.log.error('conn error', err.message);
                        }
                    });

                    conn.on('close', function () {
                        self.log.error('reconnecting');
                        setTimeout(self.init, 7000);
                    });

                    self.amqpConn = conn;
                    self.log.info(`connected ${self.user}@${self.host}:${self.port}${self.vhost}`);
                    resolve(this);

                }).catch((err)=>{
                    self.log.error(`${err.message}`);
                    setTimeout(self.init, 7000);
                });
        });
    };

    createChannel = (queue:string): Promise<Channel> => {
        return new Promise<Channel>((resolve, reject) => {
            const self = this;
            this.amqpConn.createChannel()
                .then((channel) => {
                    channel.on('error', function(err) {
                        self.log.error('channel error: ', err);
                    });

                    channel.on('close', function() {
                        self.log.info('channel closed');
                    });

                    channel.prefetch(10)
                        .then(() => {
                            channel.assertQueue(queue, { durable: true })
                                .then((assert) => {
                                    self.log.info(`assert result: ${JSON.stringify(assert)}`);
                                    resolve(channel);
                                })
                                .catch(err => {
                                    self.closeOnErr(err)
                                        .then((closed) => {
                                            if (closed) self.log.info('connection closed');
                                        })
                                });
                    });

                }).catch((err) => {
                    self.closeOnErr(err)
                        .then((closed) => {
                            if (closed) self.log.info('connection closed');
                        })
            });
        })
    };

    closeOnErr = (err): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            if (!err) {
                resolve(false);
            } else {
                this.log.error(`error: `, err);
                this.amqpConn.close()
                    .then(() => {
                        resolve(true);
                    });
            }
        })
    };
}




