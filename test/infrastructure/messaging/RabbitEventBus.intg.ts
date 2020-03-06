import RabbitEventBus from "../../../server/infrastructure/messaging/RabbitEventBus";
import RabbitClient from "../../../server/infrastructure/clients/RabbitClient";
import PostgresEventStore from "../../../server/infrastructure/persistence/PostgresEventStore";
import {
    DOMAIN_EVENT_FIXTURE, EVENT_PAYLOAD_FIXTURE,
    MockDomainEvent
} from "../../domain/domainFixtures";
import config from "../../../server/infrastructure/config/config";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {registerDomainEvent} from "../../../server/infrastructure/JsonEventTranslator";

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

let eventBus :RabbitEventBus;

beforeAll(async () => {
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
    registerDomainEvent(MockDomainEvent.name, MockDomainEvent);
    let rabbitClient = await RabbitClient.init(
        env.RABBIT_HOST,
        env.RABBIT_PORT,
        env.RABBIT_USER,
        env.RABBIT_PASS,
        env.RABBIT_VHOST);

    let postgresClient = await new PostgresClient(
        env.POSTGRES_HOST,
        env.POSTGRES_PORT,
        env.POSTGRES_USER,
        env.POSTGRES_DATABASE,
        env.POSTGRES_PASS
    ).init();

    eventBus = await RabbitEventBus.init(rabbitClient, new PostgresEventStore(postgresClient));
});


describe("publish", ()=> {
    test("should publish",  async () => {
        let res = await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        expect(res.isRight()).toBeTruthy();
        await Sleep(3000);
    });
});

describe("subscribe", ()=> {
    let mockHandler = jest.fn().mockImplementation(event => {
        return new Promise<void>(resolve => resolve())
    });

    test("should receive",  async () => {
        jest.setTimeout(30000);
        eventBus.subscribe(MockDomainEvent.name, mockHandler);
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run();
        await Sleep(1000);
        expect(mockHandler).toBeCalledTimes(4);
    });
});

