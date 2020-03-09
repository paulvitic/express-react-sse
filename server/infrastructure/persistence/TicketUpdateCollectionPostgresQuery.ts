import {TicketUpdateCollectionQueryService} from "../../application/product/TicketUpdateCollectionQueryService";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import {NextTicketUpdateCollectionPeriod} from "../../domain/product/view/NextTicketUpdateCollectionPeriod";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import {QueryResultRow} from "pg";
import * as E from "fp-ts/lib/Either";
import LogFactory from "../../domain/LogFactory";

export class TicketUpdateCollectionPostgresQuery implements TicketUpdateCollectionQueryService {
    private readonly log = LogFactory.get(TicketUpdateCollectionPostgresQuery.name);

    constructor(private readonly client: PostgresClient) {}

    nextUpdateCollectionPeriod(prodDevId: string): TE.TaskEither<Error, O.Option<NextTicketUpdateCollectionPeriod>> {
        return pipe(
            TE.fromEither(this.toNextPeriodQuery(prodDevId)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`Executing find query: ${query}`))),
            TE.chain(this.client.query),
            TE.chain(this.toPeriod)
        )
    }

    private toPeriod = (resultRow: QueryResultRow):
        TE.TaskEither<Error, O.Option<NextTicketUpdateCollectionPeriod>> => {
        return TE.tryCatch(() => {
            return new Promise((resolve, reject) => {
                this.log.info(`next period query result: ${JSON.stringify(resultRow)}`);
                resultRow.rows.lenght === 0 ?
                    resolve(O.none):
                    resolve(O.some(new NextTicketUpdateCollectionPeriod(
                        resultRow.rows[0].product_dev_id,
                        resultRow.rows[0].ticket_board_key,
                        resultRow.rows[0].pd_started_on,
                        resultRow.rows[0].tuc_ended_at ?
                            resultRow.rows[0].pd_started_on :
                            undefined
                    )))
            })
        }, err => new Error(`error while converting query result to collection period: ${(err as Error).message}`))
    };

    private toNextPeriodQuery(prodDevId: string):
        E.Either<Error, string> {
        let query = `
        SELECT pd.product_dev_id, tb.ticket_board_key, pd.started_on as pd_started_on, tuc.ended_at as tuc_ended_at, tuc.status 
        FROM product_development pd
        LEFT JOIN ticket_board tb ON pd.product_dev_id = tb.product_dev_id
        LEFT JOIN ticket_update_collection tuc ON pd.product_dev_id = tuc.product_dev_id 
        WHERE pd.product_dev_id=$ID AND (tuc.status IS NULL OR tuc.status='COMPLETED') 
        ORDER BY tuc.started_at DESC;
        `;
        return E.tryCatch2v(() => {
            query = query.replace(/\$ID/, `'${prodDevId}'`);
            return  query;
        }, err => err as Error)
    }
}
