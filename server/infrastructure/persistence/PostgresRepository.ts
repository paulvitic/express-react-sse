import {Repository} from "../../domain/Repository";
import * as T from "fp-ts/lib/Task";
import {TaskEither} from "fp-ts/lib/TaskEither";
import {Option} from "fp-ts/lib/Option";
import PostgresClient from "../clients/PostgresClient";

export default abstract class PostgresRepository<A> implements Repository<A> {
    protected constructor(protected readonly client: PostgresClient) {}

    abstract delete(id: string): TaskEither<Error, boolean>;
    abstract findById(id: string): TaskEither<Error, Option<A>>;
    abstract save(item: A): TaskEither<Error, A>;
    abstract update(id: string, item: A): TaskEither<Error, A>;
}
