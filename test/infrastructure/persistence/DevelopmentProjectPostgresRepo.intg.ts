import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import config from "../../../server/infrastructure/config/config";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import {
    DEV_PROJECT_STARTED_ON_FIXTURE,
    DEV_PROJECT_ID_FIXTURE,
    TICKET_BOARD_KEY_FIXTURE,
    TICKET_BOARD_ID_FIXTURE, DEV_PROJECT_NAME_FIXTURE
} from "../../domain/product/productFixtures";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import DevelopmentProject from "../../../server/domain/product/DevelopmentProject";
import DevelopmentProjectPostgresRepo from "../../../server/infrastructure/persistence/DevelopmentProjectPostgresRepo";

let repo: DevelopmentProjectPostgresRepo;
let client: PostgresClient;

beforeAll(async () => {
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
    client = await PostgresClient.init(env.POSTGRES_PARAMS);
    repo = new DevelopmentProjectPostgresRepo(client);
});

afterEach( async () => {
    try {
        // noinspection SqlWithoutWhere
        await client.query('DELETE FROM jira.development_project').run();
        // noinspection SqlWithoutWhere
        await client.query('DELETE FROM jira.ticket_board').run();
    } catch(err) {
        throw Error(`Error while deleting ticket board fixture: ${err.message}`)
    }
});


describe("save",  () => {
    test("should insert both dev project and records when ticked board is available", async () => {
        let devProjectFixture = new DevelopmentProject(
            DEV_PROJECT_ID_FIXTURE,
            true,
            DEV_PROJECT_NAME_FIXTURE,
            DEV_PROJECT_STARTED_ON_FIXTURE,
            new TicketBoard(
                TICKET_BOARD_ID_FIXTURE,
                TICKET_BOARD_KEY_FIXTURE,
                1000));
        let saved = await repo.save(devProjectFixture).run();
        expect(saved.isRight()).toBeTruthy();
        let result = saved.value as DevelopmentProject;
        expect(result.id).toEqual(DEV_PROJECT_ID_FIXTURE);
        expect(result.name).toEqual(DEV_PROJECT_NAME_FIXTURE);
        expect(result.startedOn).toEqual(DEV_PROJECT_STARTED_ON_FIXTURE)

    });

    test("should insert only dev project when ticked board is not available", async () => {
        let devProjectFicture = new DevelopmentProject(
            DEV_PROJECT_ID_FIXTURE,
            true,
            DEV_PROJECT_NAME_FIXTURE,
            DEV_PROJECT_STARTED_ON_FIXTURE);
        let saved = await repo.save(devProjectFicture).run();
        expect(saved.isRight()).toBeTruthy();
        let result = saved.value as DevelopmentProject;
        expect(result.id).toEqual(DEV_PROJECT_ID_FIXTURE)
    })
});
