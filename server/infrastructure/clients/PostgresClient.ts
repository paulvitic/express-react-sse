import LogFactory from "../context/LogFactory";
import {Pool, QueryConfig, QueryResult, QueryResultRow} from "pg";

export default class PostgresClient {
    private readonly log = LogFactory.get(PostgresClient.name);
    private connPool: Pool;

    constructor(private readonly host: string,
                private readonly port:number,
                private readonly user: string,
                private readonly database: string,
                password: string
    ) {
        this.connPool = new Pool({
            user, database, password, port, host,
            max: 5,
            min: 1,
            connectionTimeoutMillis: 1000,
            idleTimeoutMillis: 1000 * 60
        });
    }

    init = (): Promise<PostgresClient> => {
        this.log.info(`initializing ${this.user}@${this.host}:${this.port}/${this.database}`);
        return new Promise<PostgresClient>((resolve, reject) => {
            this.connPool.on('error', (err, client) => {
                console.error('Unexpected error on idle client', err);
                // TODO try reconnecting
            });

            this.connPool.query('SELECT NOW()')
                .then((res) => {
                    this.log.info(`connected ${this.user}@${this.host}:${this.port}/${this.database} on ${res.rows[0]["now"]}`);
                })
                .catch((err) => {
                    this.log.warn(`Error while querying ${err}`);
                    reject(err);
                });

            resolve(this);
        })
    };

    insert(query: QueryConfig): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.connPool.query(query)
                .then((result) => {
                    this.log.info(`Inserted ${result.rows.length} records`);
                    resolve(result.rows.length);
                })
                .catch(err => {
                    console.log("error while inserting: ", err);
                    reject(err);
                })
        });
    }

    read(query: QueryConfig): Promise<QueryResult<any>> {
        return new Promise<QueryResult<any>>((resolve, reject) => {
            this.connPool.query(query)
                .then((result) => {
                    this.log.info(`Read ${result.rows.length} records`);
                    resolve(result);
                })
                .catch(err => {
                    console.log("error while reading: ", err);
                    reject(err);
                })
        });
    }
}