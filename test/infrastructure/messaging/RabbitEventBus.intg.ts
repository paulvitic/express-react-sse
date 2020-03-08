import RabbitEventBus from "../../../server/infrastructure/messaging/RabbitEventBus";
import RabbitClient from "../../../server/infrastructure/clients/RabbitClient";
import PostgresEventStore from "../../../server/infrastructure/persistence/PostgresEventStore";
import {
    DOMAIN_EVENT_FIXTURE,
    MockDomainEvent
} from "../../domain/domainFixtures";
import config from "../../../server/infrastructure/config/config";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {registerDomainEvent} from "../../../server/infrastructure/JsonEventTranslator";

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

let eventBus :RabbitEventBus;
let rabbitClient: RabbitClient;

beforeAll(async () => {
    //jest.setTimeout(300000);
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
    registerDomainEvent(MockDomainEvent.name, MockDomainEvent);
    rabbitClient = await RabbitClient.init(env.RABBIT_PARAMS);
    let postgresClient = await PostgresClient.init(env.POSTGRES_PARAMS);
    eventBus = await RabbitEventBus.init(rabbitClient, new PostgresEventStore(postgresClient));
});

afterAll(async () => {
    await rabbitClient.closeConnectionTask().run();
});


describe("publish", ()=> {
    test("should publish",  async () => {
        let res = await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        expect(res.isRight()).toBeTruthy();
    });
});

describe("subscribe", ()=> {
    let mockHandler = jest.fn().mockImplementation(event => {
        return new Promise<void>(resolve => resolve())
    });

    test("should receive",  async () => {
        eventBus.subscribe(MockDomainEvent.name, mockHandler);
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        expect(mockHandler).toBeCalledTimes(4);
    });
});

