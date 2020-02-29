import {Repository} from "../../domain/Repository";
import {QueryResultRow} from "pg";
import * as TE from "fp-ts/lib/TaskEither";
import {TaskEither} from "fp-ts/lib/TaskEither";
import {Option} from "fp-ts/lib/Option";
import PostgresClient from "../clients/PostgresClient";

export default abstract class PostgresRepository<T> implements Repository<T> {
    protected readonly begin = 'BEGIN';
    protected readonly commit = 'COMMIT';
    protected readonly rollback = 'ROLLBACK';

    constructor(protected readonly client: PostgresClient) {}

    abstract delete(id: string): TaskEither<Error, boolean>;
    abstract findById(id: string): TaskEither<Error, Option<T>>;
    abstract save(item: T): TaskEither<Error, T>;
    abstract update(id: string, item: T): TaskEither<Error, T>;

    protected commitSavedEntity(id: string, result: QueryResultRow): TE.TaskEither<Error, QueryResultRow>{
        return result.rowCount === 1 && result.rows[0].id === id ?
            this.client.query(this.commit) : this.client.query(this.rollback)
    }
}
