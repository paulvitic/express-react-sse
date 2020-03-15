import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import {TicketRepository} from "../../domain/product/repository/TicketRepository";
import Ticket from "../../domain/product/Ticket";

export class TicketPostgresRepo implements TicketRepository{

    delete(id: string): TE.TaskEither<Error, boolean> {
        return undefined;
    }

    findById(id: string): TE.TaskEither<Error, O.Option<Ticket>> {
        return undefined;
    }

    findOneByRef(ref: number): TE.TaskEither<Error, O.Option<Ticket>> {
        return undefined;
    }

    save(item: Ticket): TE.TaskEither<Error, Ticket> {
        return undefined;
    }

    update(id: string, item: Ticket): TE.TaskEither<Error, Ticket> {
        return undefined;
    }
}
