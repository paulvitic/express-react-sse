import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import {TicketHistory} from "../TicketHistory";

export interface TicketHistoryQueryService {
    findLatestByTicketRef(ticketRef: number): TE.TaskEither<Error, O.Option<TicketHistory>>
    findByProductDev(productDevId: string): TE.TaskEither<Error, TicketHistory[]>
}
