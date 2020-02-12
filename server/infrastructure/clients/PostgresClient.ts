import {Pool, QueryConfig, QueryResult, QueryResultRow} from "pg";
import * as TE from "fp-ts/lib/TaskEither";
import LogFactory from "../../domain/LogFactory";

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

     executeQuery(query: QueryConfig): TE.TaskEither<Error, QueryResultRow>{
        return TE.tryCatch(() => this.connPool.query(query),
                error => new Error(`Error while executing query: ${String(error)}`))
    }

    query(text: string, values?: any[]): TE.TaskEither<Error, QueryResultRow>{
         let queryConfig = {text, values};
         return TE.tryCatch(() => this.connPool.query(queryConfig),
            error => new Error(`Error while executing query: ${String(error)}`))
    }
}
