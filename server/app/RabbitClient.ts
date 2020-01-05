import amqp, {Connection} from 'amqplib/callback_api';
import LogFactory from "./LogFactory";

// if the connection is closed or fails to be established at all, we will reconnect
const companyEventQueue = 'companyEvents';

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

        return new Promise<RabbitClient>((resolve)=>{
            const self = this;
            amqp.connect(this.rabbitMqUrl + '?heartbeat=60', function(err, conn) {
                if (err) {
                    self.log.error(`${err.message}`);
                    return setTimeout(self.init, 7000);
                }
                conn.on('error', function(err) {
                    if (err.message !== 'Connection closing') {
                        self.log.error('conn error', err.message);
                    }
                });
                conn.on('close', function() {
                    self.log.error('reconnecting');
                    return setTimeout(self.init, 7000);
                });

                self.amqpConn = conn;
                self.log.info(`connected ${self.user}@${self.host}:${self.port}${self.vhost}`);
                //whenConnected();

                resolve(self)
            })
        });
    };

    private whenConnected = () => {
        this.startCompanyConsumer();
    };

    private startCompanyConsumer = () => {
        const rabbitClient = this;
        this.amqpConn.createChannel(function(err, ch) {
            if (rabbitClient.closeOnErr(err)) return;

            ch.on('error', function(err) {
                rabbitClient.log.error('channel error', err.message);
            });

            ch.on('close', function() {
                rabbitClient.log.info('channel closed');
            });

            ch.prefetch(10);

            ch.assertQueue(companyEventQueue, { durable: true }, function(err) {
                if (rabbitClient.closeOnErr(err)) return;
                ch.consume(companyEventQueue, processMsg, { noAck: false });
                rabbitClient.log.info('company consumer started');
            });

            const processMsg = (msg) => {
                rabbitClient.log.info('msg [deliveryTag=' + msg.fields.deliveryTag + '] arrived');
                rabbitClient.work(msg, function(ok) {
                    rabbitClient.log.info('sending Ack for msg');
                    try {
                        if (ok)
                            ch.ack(msg);
                        else
                            ch.reject(msg, true);
                    } catch (e) {
                        rabbitClient.closeOnErr(e);
                    }
                });
            };
        });
    };

    private work = (msg, ack) => {
        const msgStr = msg.content.toString();
        this.log.log('got msg %s', msgStr);
        const event = JSON.parse(msgStr);
        //CreateCompany(event, ack);
        //setTimeout(() => ack(true), 12000);
    };

    private closeOnErr = (err) => {
        if (!err) return false;
        this.log.error('error', err);
        this.amqpConn.close();
        return true;
    }
}




