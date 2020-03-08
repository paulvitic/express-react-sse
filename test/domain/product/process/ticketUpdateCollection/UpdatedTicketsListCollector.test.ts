import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import UpdatedTicketsListCollector
    from "../../../../../server/domain/product/process/ticketUpdateCollection/UpdatedTicketsListCollector";
import EventBus from "../../../../../server/domain/EventBus";
import TicketUpdateCollection, {TicketUpdateCollectionPeriod} from "../../../../../server/domain/product/TicketUpdateCollection";
import {
    PRODUCT_DEV_ID_FIXTURE,
    TICKET_BOARD_ID_FIXTURE, TICKET_KEY_FIXTURE_0,
    TICKET_UPDATE_COLLECTION_ID_FIXTURE, TICKET_UPDATE_COLLECTION_PERIOD_FIXTURE, UPDATED_TICKET_FIXTURE_0
} from "../../productFixtures";
import TicketBoardIntegration from "../../../../../server/domain/product/service/TicketBoardIntegration";
import LogFactory from "../../../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../../../server/infrastructure/context/winstonLogFactory";
import {TicketUpdateCollectionFailed, UpdatedTicketsListFetched, TicketUpdateCollectionStarted} from "../../../../../server/domain/product/event";

jest.mock('../../../../../server/domain/EventBus');
jest.mock('../../../../../server/domain/product/service/TicketBoardIntegration');

let mockEventBus: EventBus = require('../../../../../server/domain/EventBus');
const mockIntegration: TicketBoardIntegration  = require('../../../../../server/domain/product/service/TicketBoardIntegration');

let collector: UpdatedTicketsListCollector;

beforeAll( () => {
    LogFactory.init(new WinstonLogFactory());
    collector = new UpdatedTicketsListCollector(mockEventBus, mockIntegration);
});

describe("on collection started", () => {
    let collectionStartedEvent= new TicketUpdateCollectionStarted(
        TicketUpdateCollection.name,
        TICKET_UPDATE_COLLECTION_ID_FIXTURE,
        PRODUCT_DEV_ID_FIXTURE,
        TICKET_BOARD_ID_FIXTURE,
        TICKET_UPDATE_COLLECTION_PERIOD_FIXTURE
    );

    test("should fetch updated tickets list", () => {
        mockIntegration.getUpdatedTickets = jest.fn().mockImplementationOnce((ticketBoardKey, period: TicketUpdateCollectionPeriod) => {
            let updatedTickets = [{...UPDATED_TICKET_FIXTURE_0, created: period.from, updated: period.from}];
            return TE.taskEither.of(updatedTickets)
        });

        mockEventBus.publishEvent = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(true)
        });

        collector.onEvent(collectionStartedEvent).then(res => {
            expect(res.isRight()).toBeTruthy();
            expect(mockEventBus.publishEvent).toBeCalledTimes(1);
            expect(mockEventBus.publishEvent).toBeCalledWith(expect.objectContaining({
                _eventType: UpdatedTicketsListFetched.name,
                updatedTickets: expect.arrayContaining([expect.objectContaining({key: TICKET_KEY_FIXTURE_0})])
            }))
        });
    });

    test("should generate collection failed event when integration client fails", () => {
        let mockErrorMessage = "Some error";
        mockIntegration.getUpdatedTickets = jest.fn().mockImplementationOnce(() => {
            return TE.leftTask(T.task.of(new Error(mockErrorMessage)))
        });

        mockEventBus.publishEvent = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(true)
        });

        collector.onEvent(collectionStartedEvent).then(res => {
            expect(res.isRight()).toBeTruthy();
            expect(mockEventBus.publishEvent).toBeCalledTimes(1);
            expect(mockEventBus.publishEvent).toBeCalledWith(expect.objectContaining({
                _eventType: TicketUpdateCollectionFailed.name,
                processor: UpdatedTicketsListCollector.name,
                reason: mockErrorMessage
            }))
        });
    });
});
