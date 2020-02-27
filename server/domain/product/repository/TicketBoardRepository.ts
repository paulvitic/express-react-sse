import TicketBoard from "../TicketBoard";
import {Repository} from "../../Repository";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";

export interface TicketBoardRepository extends Repository<TicketBoard> {
    findOneByExternalKey(key: string): TE.TaskEither<Error, O.Option<TicketBoard>>
}

