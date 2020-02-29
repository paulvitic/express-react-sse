/**
 *
 */
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./product/TicketBoard";
import {QueryResultRow} from "pg";

export interface Repository<A> {
    findById(id: string): TE.TaskEither<Error, O.Option<A>>;
    save(item: A): TE.TaskEither<Error, A>
    update(id: string, item: A): TE.TaskEither<Error, A>;
    delete(id: string): TE.TaskEither<Error, boolean>;
}
