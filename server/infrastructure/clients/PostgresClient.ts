import {Pool, QueryConfig, QueryResult, QueryResultRow} from "pg";
import * as TE from "fp-ts/lib/TaskEither";
import LogFactory from "../../domain/LogFactory";

export type PostgresClientParams = {
    host: string,
    port:number,
    user: string,
    database: string,
    password: string
}

export default class PostgresClient {
    private readonly log = LogFactory.get(PostgresClient.name);
    private connPool: Pool;

    private constructor(params: PostgresClientParams) {
        let {user, database, password, port, host} = params;
        this.connPool = new Pool({
            user, database, password, port, host,
            max: 5,
            min: 1,
            connectionTimeoutMillis: 1000,
            idleTimeoutMillis: 1000 * 60
        });
    }

    static init = (params: PostgresClientParams): Promise<PostgresClient> => {
        return new Promise<PostgresClient>((resolve, reject) => {
            let client = new PostgresClient(params);
            client.log.info(`initializing ${params.user}@${params.host}:${params.port}/${params.database}`);
            client.connPool.on('error', (err, pool) => {
                client.log.error('Unexpected error on idle client', err);
                // TODO try reconnecting
            });

            client.connPool.query('SELECT NOW()')
                .then((res) => {
                    client.log.info(`connected ${params.user}@${params.host}:${params.port}/${params.database} on ${res.rows[0]["now"]}`);
                }).catch((err) => {
                    client.log.error(`error during connection test: ${err.message}`);
                    reject(err);
                });

            resolve(client);
        })
    };

     executeQuery(query: QueryConfig): TE.TaskEither<Error, QueryResultRow>{
        return TE.tryCatch(() => this.connPool.query(query),
                error => new Error(`Error while executing query: ${String(error)}`))
    }

    query = (text: string, values?: any[]): TE.TaskEither<Error, QueryResultRow> => {
         let queryConfig = {text, values};
         return TE.tryCatch(() => this.connPool.query(queryConfig),
            error => new Error(`Error while executing query: ${String(error)}`))
    }
}
