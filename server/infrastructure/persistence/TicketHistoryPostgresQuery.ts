import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import {TicketHistory} from "../../domain/product/TicketHistory";
import {pipe} from "fp-ts/lib/pipeable";
import * as translate from "./TicketHistoryPostgresTranslator";
import {TicketHistoryQueryService} from "../../domain/product/service/TicketHistoryQueryService";
import PostgresClient from "../clients/PostgresClient";

export class TicketHistoryPostgresQuery implements TicketHistoryQueryService {
    constructor(private readonly client: PostgresClient) {}

    findLatestByTicketRef(ticketRef: number): TE.TaskEither<Error, O.Option<TicketHistory>> {
        return pipe(
            TE.fromEither(translate.toFindLatestByTicketRefQuery(ticketRef)),
            TE.chain(this.client.query),
            TE.map(queryResult => O.fromNullable(queryResult.rows[0])),
            TE.map(row => row.foldL(
                () => O.none,
                row => O.some(translate.toHistory(row)))
            ));
    }

    findByProductDev(productDevId: string): TE.TaskEither<Error, TicketHistory[]> {
        return undefined;
    }
}
