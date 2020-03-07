import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import s from 'shelljs';
import RabbitClient from "../../../server/infrastructure/clients/RabbitClient";
import config, {Environment} from "../../../server/infrastructure/config/config";

let env: Environment;

beforeAll(async () => {
    LogFactory.init(new WinstonLogFactory());
    //s.exec('docker-compose -f .docker/docker-compose.yml up');
    env = await config();
});


describe("init", () => {
    test("init", async () => {
        let client = await RabbitClient.init(env.RABBIT_PARAMS);
        expect(client).not.toBeNull();
        let closed = await client.closeConnectionTask().run();
    })
});
