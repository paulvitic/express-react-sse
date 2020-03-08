import LogFactory, {Logger} from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import * as shell from 'shelljs';
import RabbitClient from "../../../server/infrastructure/clients/RabbitClient";
import config, {Environment} from "../../../server/infrastructure/config/config";

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
let log: Logger;

let env: Environment;

beforeAll(async () => {
    //jest.setTimeout(300000);
    //let docketStart = shell.exec('docker-compose -f .docker/docker-compose.yml up -d').code;
    LogFactory.init(new WinstonLogFactory());
    //log = LogFactory.get("RabbitClientTest");
    //log.info(`docker start: ${docketStart}`);
    //await sleep(10000);
    env = await config();
});

afterAll(async () => {
    //let dockerStop = shell.exec('docker-compose -f .docker/docker-compose.yml stop').code;
    //log.info(`\ndocker stop: ${dockerStop}`);
});

describe("init", () => {
    test("init", async () => {
        let client = await RabbitClient.init(env.RABBIT_PARAMS);
        expect(client).not.toBeNull();
        let closed = await client.closeConnectionTask().run();
    })
});
