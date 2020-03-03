import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import config from "../../../server/infrastructure/config/config";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../../server/domain/product/TicketUpdateCollection";
import TicketUpdateCollectionRepository
    from "../../../server/domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollectionPostgresRepo
    from "../../../server/infrastructure/persistence/TicketUpdateCollectionPostgresRepo";
import {
    DEV_PROJECT_ID_FIXTURE,
    TICKET_UPDATE_COLL_ID_FIXTURE
} from "../../domain/product/productFixtures";
import TicketUpdate from "../../../server/domain/product/TicketUpdate";

let repo: TicketUpdateCollectionRepository;
let client: PostgresClient;

beforeAll(async () => {
    LogFactory.init(new WinstonLogFactory());
    let env = await config();

    client = await new PostgresClient(
        env.POSTGRES_HOST,
        env.POSTGRES_PORT,
        env.POSTGRES_USER,
        env.POSTGRES_DATABASE,
        env.POSTGRES_PASS
    ).init();

    repo = new TicketUpdateCollectionPostgresRepo(client);
});

afterEach( async () => {
    try {
        // noinspection SqlWithoutWhere
        await client.query('DELETE FROM jira.ticket_update').run();
        // noinspection SqlWithoutWhere
        await client.query('DELETE FROM jira.ticket_update_collection').run();
    } catch(err) {
        throw Error(`Error while deleting ticket board fixture: ${err.message}`)
    }
});

describe("save", () => {
    let ticketUpdates = [
        new TicketUpdate("dd", 2000, "ff"),
        new TicketUpdate("aa", 2000, "gg")
    ];
    let ticketUpdateCollectionFixture = new TicketUpdateCollection(
        TICKET_UPDATE_COLL_ID_FIXTURE,
        true,
        DEV_PROJECT_ID_FIXTURE,
        TicketUpdateCollectionStatus.RUNNING,
        new Date(),
        undefined,
        undefined,
        undefined,
        ticketUpdates);

    test("should save", async () => {
        let saved = await repo.save(ticketUpdateCollectionFixture).run();
        expect(saved.isRight()).toBeTruthy();
    })
});
