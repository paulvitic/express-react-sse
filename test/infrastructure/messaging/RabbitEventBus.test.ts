import RabbitEventBus from "../../../server/infrastructure/messaging/RabbitEventBus";
import RabbitClient from "../../../server/infrastructure/clients/RabbitClient";
import PostgresEventStore from "../../../server/infrastructure/persistence/PostgresEventStore";
import {DOMAIN_EVENT_FIXTURE} from "../../domain/domainFixtures";

import config from "../../../server/infrastructure/config/config";
import PostgresClient from "../../../server/infrastructure/clients/PostgresClient";
import EventBus from "../../../server/domain/EventBus";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";

const initializeEventBus = async (): Promise<EventBus> => {
    LogFactory.init(new WinstonLogFactory());
    let env = await config();
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

    return await RabbitEventBus.init(rabbitClient, new PostgresEventStore(postgresClient));
};

test("should publish",  async () => {
    let eventBus = await initializeEventBus();
    expect(eventBus.publishEvent(DOMAIN_EVENT_FIXTURE).run()
        .then(res =>
            expect(res.isRight()).toBe(true)
        )
        .catch(err => {throw new Error(String(err)) }))
});
