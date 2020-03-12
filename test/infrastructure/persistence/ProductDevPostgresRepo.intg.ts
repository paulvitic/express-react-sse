import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import config from "../../../server/infrastructure/config/config";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import {
    PRODUCT_DEV_STARTED_ON_FIXTURE,
    PRODUCT_DEV_ID_FIXTURE,
    TICKET_BOARD_KEY_FIXTURE,
    TICKET_BOARD_ID_FIXTURE, PRODUCT_DEV_NAME_FIXTURE
} from "../../domain/product/productFixtures";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import ProductDevelopment from "../../../server/domain/product/ProductDevelopment";
import ProductDevPostgresRepo from "../../../server/infrastructure/persistence/ProductDevPostgresRepo";

let repo: ProductDevPostgresRepo;
let client: PostgresClient;

beforeAll(async () => {
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
    client = await PostgresClient.init(env.POSTGRES_PARAMS);
    repo = new ProductDevPostgresRepo(client);
});

afterEach( async () => {
    try {
        // noinspection SqlWithoutWhere
        await client.query('DELETE FROM jira.ticket_board').run();
        // noinspection SqlWithoutWhere
        await client.query('DELETE FROM jira.product_development').run();
    } catch(err) {
        throw Error(`Error while deleting ticket board fixture: ${err.message}`)
    }
});


describe("save",  () => {
    test("should insert both dev project and records when ticket board is available", async () => {
        let devProjectFixture = new ProductDevelopment(
            PRODUCT_DEV_ID_FIXTURE,
            true,
            PRODUCT_DEV_NAME_FIXTURE,
            new Date(PRODUCT_DEV_STARTED_ON_FIXTURE),
            new TicketBoard(
                TICKET_BOARD_ID_FIXTURE,
                TICKET_BOARD_KEY_FIXTURE,
                1000,
                PRODUCT_DEV_ID_FIXTURE));
        let saved = await repo.save(devProjectFixture).run();
        expect(saved.isRight()).toBeTruthy();
        let result = saved.value as ProductDevelopment;
        expect(result.ticketBoard).not.toBeNull();
        expect(result.id).toEqual(PRODUCT_DEV_ID_FIXTURE);
        expect(result.name).toEqual(PRODUCT_DEV_NAME_FIXTURE);
    });

    test("should insert only dev project when ticked board is not available", async () => {
        let devProjectFicture = new ProductDevelopment(
            PRODUCT_DEV_ID_FIXTURE,
            true,
            PRODUCT_DEV_NAME_FIXTURE,
            new Date(PRODUCT_DEV_STARTED_ON_FIXTURE));
        let saved = await repo.save(devProjectFicture).run();
        expect(saved.isRight()).toBeTruthy();
        let result = saved.value as ProductDevelopment;
        expect(result.id).toEqual(PRODUCT_DEV_ID_FIXTURE)
    })
});
