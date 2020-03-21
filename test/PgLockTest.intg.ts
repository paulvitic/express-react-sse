import TicketUpdateCollectionRepository from "../server/domain/product/repository/TicketUpdateCollectionRepository";
import PostgresClient from "../server/infrastructure/clients/PostgresClient";
import {
    PRODUCT_DEV_ID_FIXTURE,
    PRODUCT_DEV_NAME_FIXTURE,
    PRODUCT_DEV_STARTED_ON_FIXTURE, TICKET_UPDATE_COLL_ID_FIXTURE
} from "./domain/product/productFixtures";
import LogFactory from "../server/domain/LogFactory";
import WinstonLogFactory from "../server/infrastructure/context/winstonLogFactory";
import config from "../server/infrastructure/context/config";
import TicketUpdateCollectionPostgresRepo
    from "../server/infrastructure/persistence/TicketUpdateCollectionPostgresRepo";

let repo: TicketUpdateCollectionRepository;
let postgres: PostgresClient;

beforeAll(async () => {
    jest.setTimeout(300000);
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
    postgres = await PostgresClient.init(env.POSTGRES_PARAMS);
    repo = new TicketUpdateCollectionPostgresRepo(postgres);
});

describe("lock", () => {

    test("lock", async () => {
        let releaseAllLocks = `
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity
            WHERE pid <> pg_backend_pid();`;

        let selectForUpdate = `
        BEGIN;
        SELECT * FROM  ticket_update_collection AS tuc
        LEFT JOIN ticket_update AS tu ON tuc.collection_id = tu.collection_fk
        WHERE tuc.collection_id='200314-ljr2fm' 
        FOR UPDATE OF tuc;
        `;

        let updateToRunning = `UPDATE ticket_update_collection SET status='RUNNING' where collection_id='200314-ljr2fm';`;
        let updateToComplete = `UPDATE ticket_update_collection SET status='COMPLETED' where collection_id='200314-ljr2fm';`;

        let locks = `SELECT locktype,transactionid,virtualtransaction,pid,mode,granted,fastpath FROM pg_locks;`;

        await postgres.query(releaseAllLocks).run();

        let client0 = await postgres.client();
        let client1 = await postgres.client();

/*        let selectForUpdate0Res = await client0.query(selectForUpdate);
        let updateToRunningRes = await client0.query(updateToRunning);
        await client0.query('COMMIT;');
        client0.release();

        let selectForUpdate1Res = await client1.query(selectForUpdate);
        let updateToCompleteRes = await client1.query(updateToComplete);
        await client1.query('COMMIT;');
        client1.release();*/

        let selectForUpdate0Res = await postgres.query(selectForUpdate).run();
        await postgres.query(updateToRunning).run();
        await postgres.query('COMMIT').run();

        await postgres.query(selectForUpdate).run();
        await postgres.query(updateToComplete).run();
        await postgres.query('COMMIT').run();

        let lockResult = await postgres.query(locks).run();

        expect(selectForUpdate0Res).not.toBeNull();

    })
});
