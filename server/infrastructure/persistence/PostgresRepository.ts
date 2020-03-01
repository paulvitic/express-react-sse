import {Repository} from "../../domain/Repository";
import {QueryResultRow} from "pg";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import {TaskEither} from "fp-ts/lib/TaskEither";
import {Option} from "fp-ts/lib/Option";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";

export default abstract class PostgresRepository<A> implements Repository<A> {
    protected readonly begin = 'BEGIN';
    protected readonly commitQuery = 'COMMIT';
    protected readonly rollBackQuery = 'ROLLBACK';

    constructor(protected readonly client: PostgresClient) {}

    abstract delete(id: string): TaskEither<Error, boolean>;
    abstract findById(id: string): TaskEither<Error, Option<A>>;
    abstract save(item: A): TaskEither<Error, A>;
    abstract update(id: string, item: A): TaskEither<Error, A>;

    protected commitSavedEntity(id: string, result: QueryResultRow): TE.TaskEither<Error, QueryResultRow>{
        return result.rowCount === 1 && result.rows[0].id === id ?
            this.client.query(this.commitQuery) : this.client.query(this.rollBackQuery)
    }

    protected commit(result: QueryResultRow): TE.TaskEither<Error, QueryResultRow>{
        return pipe(
            this.client.query(this.commitQuery),
            TE.chain( () => TE.right(T.task.of(result)))
        )
    }

    protected rollBack(err: Error): TE.TaskEither<Error, QueryResultRow>{
        return pipe(
            this.client.query(this.rollBackQuery),
            TE.chain(() => TE.left(T.task.of(err)))
        )
    }
}
