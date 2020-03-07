import * as O from 'fp-ts/lib/Option';
import config from "../../../server/infrastructure/config/config";
import JiraIntegration from "../../../server/infrastructure/integration/JiraIntegration";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {
    TICKET_BOARD_KEY_FIXTURE,
    TICKET_UPDATE_COLL_FROM_FIXTURE,
    TICKET_UPDATE_COLL_TO_FIXTURE
} from "../../domain/product/productFixtures";
import {
    TicketBoardInfo,
    TicketChangeLog,
    UpdatedTicket
} from "../../../server/domain/product/service/TicketBoardIntegration";
import {TicketUpdateCollectionPeriod} from "../../../server/domain/product/TicketUpdateCollection";

let jiraIntegration: JiraIntegration;

beforeAll(async () => {
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
    jiraIntegration = new JiraIntegration(env.JIRA_PARAMS);
});

describe('ticket board', () => {
    test('should not assert for non existing ticket board key', async () => {
        let assert = jiraIntegration.assertProject(TICKET_BOARD_KEY_FIXTURE);
        let res = await assert.run();
        expect(res.isLeft()).toBeTruthy();
        let error = res.value as Error;
        expect(error.message).toEqual('Project assert failed with unknown jira API error status code 400');
    });

    test.skip('should not assert', async () => {
        let assert = jiraIntegration.assertProject("CONTACT");
        let res = await assert.run();
        expect(res.isRight()).toBeTruthy();
        let info = res.value as TicketBoardInfo;
        expect(info.key).toEqual("CONTACT")
    });
});

describe('ticket updates', () => {
    test('should fail to get for non existing ticket board key', async () => {
        let assert = jiraIntegration.getUpdatedTickets(TICKET_BOARD_KEY_FIXTURE,
            new TicketUpdateCollectionPeriod(TICKET_UPDATE_COLL_FROM_FIXTURE, TICKET_UPDATE_COLL_TO_FIXTURE));
        let res = await assert.run();
        expect(res.isLeft()).toBeTruthy();
        let error = res.value as Error;
        expect(error.message).toEqual('Project assert failed with unknown jira API error status code 400');
    });

    test.skip('should get', async () => {
        let assert = jiraIntegration.getUpdatedTickets("CONTACT",
            new TicketUpdateCollectionPeriod(new Date('2019-11-27T00:00:00.000'), new Date('2019-11-28T00:00:00.000')));
        let res = await assert.run();
        expect(res.isRight()).toBeTruthy();
        let updates = res.value as UpdatedTicket[];
        expect(updates.length).toBeGreaterThan(0)
    });
});

describe('ticket changelog', () => {
    test.skip('should get', async () => {
        let changelog = jiraIntegration.readTicketChangeLog("CONTACT-84",
            new TicketUpdateCollectionPeriod(new Date('2020-01-03T00:00:00.000'), new Date('2020-01-04T00:00:00.000')));
        let res = await changelog.run();
        expect(res.isRight()).toBeTruthy();
        let updates = res.value as O.Option<TicketChangeLog>;
        expect(updates.isSome() && updates.value.changeLog).toHaveLength(2);
    });
});


