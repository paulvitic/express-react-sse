import TicketBoardPostgresRepo from "../../../server/infrastructure/persistence/TicketBoardPostgresRepo";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import config from "../../../server/infrastructure/config/config";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import TicketBoardIntegration from "../../../server/domain/product/TicketBoardIntegration";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import {EXTERNAL_KEY_FIXTURE, PROJECT_INFO_FIXTURE} from "../../domain/product/productFixtures";

let repo: TicketBoardPostgresRepo;
let ticketBoardFixture: TicketBoard;
let client: PostgresClient;

let mockIntegration: TicketBoardIntegration = {
    assertProject: jest.fn()
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

    repo = new TicketBoardPostgresRepo(client);

    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.fromEither(E.right(PROJECT_INFO_FIXTURE));
    });
    let created = await TicketBoard.create(EXTERNAL_KEY_FIXTURE, mockIntegration).run();

    if (created.isRight()) {
        let saved = await repo.save(created.value).run();
        if (saved.isRight()) {
            ticketBoardFixture = saved.value
        } else {
            throw Error(`Error while saving ticket board fixture: ${saved.value}`)
        }
    } else {
        throw Error(`Error while creating ticket board fixture: ${created.value}`)
    }
});

afterAll(async () => {
    // noinspection SqlWithoutWhere
    const query = {
        text: 'DELETE FROM jira.ticket_board'
    };
    try {
        let deleteResult = await client.execute(query);
    } catch(err) {
        throw Error(`Error while deleting ticket board fixture: ${err.message}`)
    }
});

test('should find ticket board by external key', async () => {
    let found = await repo.findOneByExternalKey(EXTERNAL_KEY_FIXTURE).run();
    expect(found.isRight()).toBe(true);
    if (found.isRight()) {
        let option = found.value;
        expect(option.isSome()).toBe(true);
        let result = option.getOrElse(null);
        expect(result).not.toBeNull();
        expect(result.externalKey).toEqual(ticketBoardFixture.externalKey)
    }
});

test('should not find ticket board by external key', async () => {
    let found = await repo.findOneByExternalKey("SOME_KEY").run();
    expect(found.isRight()).toBe(true);
    if (found.isRight()) {
        expect(found.value.isNone()).toBe(true);
    }
});

test('should not delete ticket board', async () => {
    let deleted = await repo.delete("SOME_KEY").run();
    expect(deleted.isRight()).toBe(true);
    if (deleted.isRight()) {
        expect(deleted.value).toBe(false);
    }
});
