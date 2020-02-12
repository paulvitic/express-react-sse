import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import config from "../../../server/infrastructure/config/config";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import TicketBoardPostgresRepo from "../../../server/infrastructure/persistence/TicketBoardPostgresRepo";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import {
    DEVELOPMENT_PROJECT_ID_FIXTURE,
    EXTERNAL_KEY_FIXTURE, PROJECT_DESCRIPTION_FIXTURE,
    TICKET_BOARD_ID_FIXTURE
} from "../../domain/product/productFixtures";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import DevelopmentProject from "../../../server/domain/product/DevelopmentProject";
import DevelopmentProjectPostgresRepo from "../../../server/infrastructure/persistence/DevelopmentProjectPostgresRepo";

let repo: DevelopmentProjectPostgresRepo;
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
        let mockDevProject = new DevelopmentProject(
            DEVELOPMENT_PROJECT_ID_FIXTURE,
            true,
            PROJECT_DESCRIPTION_FIXTURE,
            new TicketBoard(
                TICKET_BOARD_ID_FIXTURE,
                EXTERNAL_KEY_FIXTURE,
                1000));
        let saved = await repo.save(mockDevProject).run();
        expect(saved.isRight()).toBeTruthy();
        let result = saved.value as DevelopmentProject;
        expect(result.id).toEqual(DEVELOPMENT_PROJECT_ID_FIXTURE)
    });

    test("should insert only dev project when ticked board is not available", async () => {
        let mockDevProject = new DevelopmentProject(
            DEVELOPMENT_PROJECT_ID_FIXTURE,
            true,
            PROJECT_DESCRIPTION_FIXTURE);
        let saved = await repo.save(mockDevProject).run();
        expect(saved.isRight()).toBeTruthy();
        let result = saved.value as DevelopmentProject;
        expect(result.id).toEqual(DEVELOPMENT_PROJECT_ID_FIXTURE)
    })
});
