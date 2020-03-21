import LogFactory, {Logger} from "../../server/domain/LogFactory";
import WinstonLogFactory from "../../server/infrastructure/context/winstonLogFactory";
import config from "../../server/infrastructure/context/config";
import PostgresClient from "../../server/infrastructure/clients/PostgresClient";
import axios from "axios";

let client: PostgresClient;
let log: Logger;

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function deleteAll() {
    await sleep(1000);
    let deleteAllQuery = `
        DELETE FROM ticket_update;
        DELETE FROM ticket_update_collection;
        DELETE FROM ticket_board;
        DELETE FROM product_development;
        DELETE FROM event_log;
    `;
    try {
        log.info(`deleting all`);
        await client.query(deleteAllQuery).run();
    } catch (err) {
        log.error(`${err.stack}`);
        throw Error(`Error while deleting all tables: ${err.message}`)
    }
}

beforeAll(async () => {
    jest.setTimeout(300000);
    LogFactory.init(new WinstonLogFactory());
    log = LogFactory.get();
    let env = await config();
    client = await PostgresClient.init(env.POSTGRES_PARAMS);
});

afterAll(async () => {

});

describe("create product development", () => {
    it("collection should complete without collecting any ticket updates", async () => {
        try {
            let httpResponse = await axios(
                `http://localhost:3000/api/v1/productDevelopments`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'},
                    data: {
                        ticketBoardKey: "CONTACT",
                        defaultStart: "2019-11-26"
                    }
                });
            expect(httpResponse).not.toBeNull();

            let productDevId = httpResponse.data;
            log.info(`${productDevId}`);

            httpResponse = await axios(
                `http://localhost:3000/api/v1/ticketUpdateCollections`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'},
                    data: {
                        productDevId: productDevId,
                        defaultFrom: "2019-11-26"
                    }
                });
            expect(httpResponse).not.toBeNull();
            log.info(`${httpResponse.data}`);

            await sleep(2000);
            httpResponse = await axios(
                `http://localhost:3000/api/v1/ticketUpdateCollections`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'},
                    data: {
                        productDevId: productDevId
                    }
                });
            expect(httpResponse).not.toBeNull();
            log.info(`${httpResponse.data}`);
            await sleep(2000);

            httpResponse = await axios(
                `http://localhost:3000/api/v1/ticketUpdateCollections`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'},
                    data: {
                        productDevId: productDevId
                    }
                });
            expect(httpResponse).not.toBeNull();
            log.info(`${httpResponse.data}`);
            await sleep(2000);

            await deleteAll();
        } catch (e) {
            log.info(`${e.message}`);
            expect(e).not.toBeNull();
            await deleteAll();
        }
    })
});


