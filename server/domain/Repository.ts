/**
 *
 */
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./product/TicketBoard";

export interface Repository<A> {
    find(item: A): TE.TaskEither<Error, A[]>;
    findOne(id: string): TE.TaskEither<Error, O.Option<A>>;
    save(item: A): TE.TaskEither<Error, A>
    update(id: string, item: A): TE.TaskEither<Error, A>;
    delete(id: string): TE.TaskEither<Error, boolean>;
}
