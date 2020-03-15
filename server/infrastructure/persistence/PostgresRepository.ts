import {Repository} from "../../domain/Repository";
import {QueryResultRow} from "pg";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import {TaskEither} from "fp-ts/lib/TaskEither";
import {Option} from "fp-ts/lib/Option";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import LogFactory from "../../domain/LogFactory";

export default abstract class PostgresRepository<A> implements Repository<A> {
    protected readonly commitQuery = `
        COMMIT;`;
    protected readonly rollBackQuery = `
        ROLLBACK;`;

    protected constructor(protected readonly client: PostgresClient) {}

    abstract delete(id: string): TaskEither<Error, boolean>;
    abstract findById(id: string): TaskEither<Error, Option<A>>;
    abstract save(item: A): TaskEither<Error, A>;
    abstract update(id: string, item: A): TaskEither<Error, A>;

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
