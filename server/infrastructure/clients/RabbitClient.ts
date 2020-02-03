import amqp, {Channel, ConfirmChannel, Connection} from 'amqplib';
import LogFactory from "../context/LogFactory";


// if the connection is closed or fails to be established at all, we will reconnect
export default class RabbitClient {
    private readonly log = LogFactory.get(RabbitClient.name);
    private readonly url: string;
    private connection: Connection;

    private constructor(private readonly host: string,
                private readonly port:number,
                private readonly user: string,
                password: string,
                private readonly vhost: string
    ) {
        this.url = `amqp://${user}:${password}@${host}:${port}${vhost}`;
    }

    static init = (host: string,
                   port: number,
                   user: string,
                   password: string,
                   vhost: string): Promise<RabbitClient> => {

        return new Promise<RabbitClient>((resolve, reject) => {
            let client = new RabbitClient(host, port, user, password, vhost);
            client.log.info(`initializing ${user}@${host}:${port}${vhost}`);
            client.connect()
                .then(connected => {
                    if (connected) resolve(client);
                })
        });
    };

    connect = (): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            const self = this;
            amqp.connect(self.url + '?heartbeat=60')
                .then((conn) => {
                    conn.on('error', function (err) {
                        if (err.message !== 'Connection closing') {
                            self.log.error('conn error', err.message);
                        }
                    });

                    conn.on('close', function () {
                        self.log.error('reconnecting');
                        setTimeout(self.connect, 7000);
                    });

                    self.connection = conn;
                    self.log.info(`connected ${self.user}@${self.host}:${self.port}${self.vhost}`);
                    resolve(true);

                }).catch((err)=>{
                self.log.error(`${err.message}`);
                setTimeout(self.connect, 7000);
            });
        })
    };

    closeOnErr = (err): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            if (!err) {
                resolve(false);
            } else {
                this.log.error(`error: `, err);
                this.connection.close()
                    .then(() => {
                        resolve(true);
                    });
            }
        })
    };

    createChannel = (exchange:string): Promise<Channel> => {
        return new Promise<Channel>(async (resolve, reject) => {
            const self = this;
            try {
                let channel = await this.connection.createChannel();
                channel.on('error', function(err) {
                    self.log.error('channel error: ', err);
                });

                channel.on('close', function() {
                    self.log.info('channel closed');
                });

                await channel.prefetch(10);

                let exchangeAssert = await channel.assertExchange(exchange,'fanout',{ durable: true })
                self.log.info(`exchange assert: ${JSON.stringify(exchangeAssert)}`);
                resolve(channel);

            } catch (err) {
                let closed = await self.closeOnErr(err);
                if (closed) self.log.info('connection closed');
            }
        })
    };

    createConfirmChannel = (exchange:string): Promise<ConfirmChannel> => {
        return new Promise<ConfirmChannel>(async (resolve, reject) => {
            const self = this;
            try {
                let channel = await this.connection.createConfirmChannel();
                channel.on('error', function(err) {
                    self.log.error('channel error: ', err);
                });

                channel.on('close', function() {
                    self.log.info('channel closed');
                });

                await channel.prefetch(10);

                let exchangeAssert = await channel.assertExchange(exchange,'fanout',{ durable: true });
                self.log.info(`exchange assert: ${JSON.stringify(exchangeAssert)}`);
                resolve(channel);

            } catch (err) {
                let closed = await self.closeOnErr(err);
                if (closed) self.log.info('connection closed');
            }
        })
    };
}




