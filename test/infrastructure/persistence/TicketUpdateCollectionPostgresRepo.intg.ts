import DevelopmentProjectPostgresRepo from "../../../server/infrastructure/persistence/DevelopmentProjectPostgresRepo";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import config from "../../../server/infrastructure/config/config";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../../server/domain/product/TicketUpdateCollection";
import TicketUpdateCollectionRepository
    from "../../../server/domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollectionPostgresRepo
    from "../../../server/infrastructure/persistence/TicketUpdateCollectionPostgresRepo";
import DevelopmentProject from "../../../server/domain/product/DevelopmentProject";
import {
    DEV_PROJECT_ID_FIXTURE,
    DEV_PROJECT_NAME_FIXTURE,
    DEV_PROJECT_STARTED_ON_FIXTURE, TICKET_BOARD_ID_FIXTURE, TICKET_BOARD_KEY_FIXTURE, TICKET_UPDATE_COLL_ID_FIXTURE
} from "../../domain/product/productFixtures";
import TicketBoard from "../../../server/domain/product/TicketBoard";

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

describe("save", () => {
    let ticketUpdateCollectionFixture = new TicketUpdateCollection(
        TICKET_UPDATE_COLL_ID_FIXTURE,
        true,
        DEV_PROJECT_ID_FIXTURE,
        TicketUpdateCollectionStatus.RUNNING,
        new Date());

    test("should save", async () => {
        let saved = await repo.save(ticketUpdateCollectionFixture).run();
        expect(saved.isRight()).toBeTruthy();
    })
});
