import * as translate from "../../../server/infrastructure/persistence/TicketUpdateCollectionPostgresTranslator"
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";

describe("fromQueryResultRows", () => {
    LogFactory.init(new WinstonLogFactory());

    test("", () => {
        let rows = [
            {
                collection_id: "200309-qizagk",
                active: true,
                status: "RUNNING",
                product_dev_fk: "200309-v2j98q",
                ticket_board_key: 10012,
                from_day: new Date("2018-11-26T21:00:00.000Z"),
                to_day: new Date("2018-11-27T21:00:00.000Z"),
                started_at: new Date("2020-03-09T19:04:29.000Z"),
                ended_at: null,
                ticket_update_id: null,
                ticket_ref: null,
                ticket_key: null,
                collected: null,
                collection_fk: null
            }];
        let res = translate.fromQueryResultRows(rows);
        expect(res).not.toBeNull()
    })
});
