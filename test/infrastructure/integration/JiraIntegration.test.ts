import config from "../../../server/infrastructure/config/config";
import JiraIntegration from "../../../server/infrastructure/integration/JiraIntegration";

let jiraIntegration: JiraIntegration;

beforeAll(async () => {
    let env = await config();
    jiraIntegration = new JiraIntegration(env.JIRA_URL,
        env.JIRA_USER,
        env.JIRA_API_TOKEN);
});

test('should not assert ticket board', async () => {
    let assert = jiraIntegration.assertProject("NONE");
    let res = await assert.run();
    expect(res.isLeft()).toBe(true);
    expect(res.inspect()).toEqual('left(Error: project is not found or the user does not have permission to view it)');
});
