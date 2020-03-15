import {Repository} from "../../Repository";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import Ticket from "../Ticket";

export interface TicketRepository extends Repository<Ticket> {
    findOneByRef(key: number): TE.TaskEither<Error, O.Option<Ticket>>
}

