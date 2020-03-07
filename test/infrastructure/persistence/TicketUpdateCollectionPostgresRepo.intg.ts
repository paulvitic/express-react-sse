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
    client = await PostgresClient.init(env.POSTGRES_PARAMS);
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

describe("find by id", () => {
    let ticketUpdateCollectionFixture = new TicketUpdateCollection(
        `${TICKET_UPDATE_COLL_ID_FIXTURE}-0`,
        true,
        DEV_PROJECT_ID_FIXTURE,
        TicketUpdateCollectionStatus.RUNNING,
        new Date(),
        undefined,
        undefined,
        undefined,
        [
            new TicketUpdate("aa", 2000, "bb"),
            new TicketUpdate("cc", 2001, "dd")
        ]);

    test("should not find", async () => {
        await repo.save(ticketUpdateCollectionFixture).run();
        let found = await repo.findById(`${TICKET_UPDATE_COLL_ID_FIXTURE}-1`).run();
        expect(found.isRight() && found.value.isNone()).toBeTruthy();
    });

    test("should find", async () => {
        await repo.save(ticketUpdateCollectionFixture).run();
        let found = await repo.findById(`${TICKET_UPDATE_COLL_ID_FIXTURE}-0`).run();
        expect(found.isRight() && found.value.isSome()).toBeTruthy();
    })
});

describe("find by status", () => {
    let ticketUpdateCollectionFixture0 = new TicketUpdateCollection(
        `${TICKET_UPDATE_COLL_ID_FIXTURE}-0`,
        true,
        DEV_PROJECT_ID_FIXTURE,
        TicketUpdateCollectionStatus.RUNNING,
        new Date(),
        undefined,
        undefined,
        undefined,
        [
            new TicketUpdate("aa", 2000, "bb"),
            new TicketUpdate("cc", 2001, "dd")
        ]);

    let ticketUpdateCollectionFixture1 = new TicketUpdateCollection(
        `${TICKET_UPDATE_COLL_ID_FIXTURE}-1`,
        true,
        DEV_PROJECT_ID_FIXTURE,
        TicketUpdateCollectionStatus.RUNNING,
        new Date(),
        undefined,
        undefined,
        undefined,
        [
            new TicketUpdate("ee", 2002, "ff"),
            new TicketUpdate("gg", 2003, "hh")
        ]);

    test("should find two", async () => {
        await repo.save(ticketUpdateCollectionFixture0).run();
        await repo.save(ticketUpdateCollectionFixture1).run();
        let found = await repo.findByStatus(TicketUpdateCollectionStatus.RUNNING).run();
        expect(found.isRight() && found.value.length===2).toBeTruthy();
    });

    test("should not find", async () => {
        await repo.save(ticketUpdateCollectionFixture0).run();
        await repo.save(ticketUpdateCollectionFixture1).run();
        let found = await repo.findByStatus(TicketUpdateCollectionStatus.COMPLETED).run();
        expect(found.isRight() && found.value.length === 0).toBeTruthy();
    })
});
