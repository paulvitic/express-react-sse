import TicketBoardPostgresRepo from "../../../server/infrastructure/persistence/TicketBoardPostgresRepo";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import config from "../../../server/infrastructure/config/config";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import TicketBoardIntegration, {
    TicketBoardInfo,
    TicketBoardIntegrationFailure
} from "../../../server/domain/product/TicketBoardIntegration";
import {Either, right} from "fp-ts/lib/Either";

let repo: TicketBoardPostgresRepo;
let ticketBoardFixture: TicketBoard;
let client: PostgresClient;

let mockIntegration: TicketBoardIntegration = {
    assertProject(key: string): Promise<Either<TicketBoardIntegrationFailure, TicketBoardInfo>> {
        return new Promise<Either<TicketBoardIntegrationFailure, TicketBoardInfo>>(
            resolve => {
                resolve(right({
                    id: 1000,
                    key: key,
                    name: "Fixture Project",
                    description: "",
                    category: {
                        id: 1001,
                        name: "Product Development",
                        description: ""
                    }
                }))
            });
    }
};

beforeAll(async () => {
    let env = await config();

    client = await new PostgresClient(
        env.POSTGRES_HOST,
        env.POSTGRES_PORT,
        env.POSTGRES_USER,
        env.POSTGRES_DATABASE,
        env.POSTGRES_PASS
    ).init();

    repo = await new TicketBoardPostgresRepo(client);

    let created = await TicketBoard.create("TEST", mockIntegration);
    if (created.isRight()){
        let saved = await repo.save(created.value);
        if (saved.isRight()) {
            ticketBoardFixture = saved.value
        } else {
            throw Error(`Error while saving ticket board fixture: ${saved.value.message}`)
        }
    } else {
        throw Error(`Error while creating ticket board fixture: ${created.value.message}`)
    }
});

afterAll(async () => {
    // noinspection SqlWithoutWhere
    const query = {
        text: 'DELETE FROM jira.ticket_board'
    };
    try {
        await client.execute(query);
    } catch(err) {
        throw Error(`Error while deleting ticket board fixture: ${err.message}`)
    }
});

test('should not find ticket board', async () => {
    let find = await repo.findOneByExternalKey("TEST");
    expect(find.isSome()).toBe(true);
});
