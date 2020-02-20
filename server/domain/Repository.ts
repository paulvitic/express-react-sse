/**
 *
 */
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./product/TicketBoard";

export abstract class Repository<A> {
    protected readonly begin = 'BEGIN';
    protected readonly commit = 'COMMIT';
    protected readonly rollback = 'ROLLBACK';
    abstract findById(id: string): TE.TaskEither<Error, O.Option<A>>;
    abstract save(item: A): TE.TaskEither<Error, A>
    abstract update(id: string, item: A): TE.TaskEither<Error, A>;
    abstract delete(id: string): TE.TaskEither<Error, boolean>;
}
