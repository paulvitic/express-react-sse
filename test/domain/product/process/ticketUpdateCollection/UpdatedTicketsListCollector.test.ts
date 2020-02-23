import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import {TicketUpdateCollectionStarted} from "../../../../../server/domain/product/event/TicketUpdateCollectionStarted";
import UpdatedTicketsListCollector
    from "../../../../../server/domain/product/process/ticketUpdateCollection/UpdatedTicketsListCollector";
import EventBus from "../../../../../server/domain/EventBus";
import TicketUpdateCollection from "../../../../../server/domain/product/TicketUpdateCollection";
import {
    DEV_PROJECT_ID_FIXTURE, DEV_PROJECT_STARTED_ON_FIXTURE,
    TICKET_BOARD_ID_FIXTURE, TICKET_KEY_FIXTURE,
    TICKET_UPDATE_COLLECTION_ID_FIXTURE, UPDATED_TICKET_FIXTURE
} from "../../productFixtures";
import TicketBoardIntegration, {UpdatedTicket} from "../../../../../server/domain/product/service/TicketBoardIntegration";
import LogFactory from "../../../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../../../server/infrastructure/context/winstonLogFactory";
import {UpdatedTicketsListFetched} from "../../../../../server/domain/product/event/UpdatedTicketsListFetched";
import {TicketUpdateCollectionFailed} from "../../../../../server/domain/product/event/TicketUpdateCollectionFailed";

jest.mock('../../../../../server/domain/EventBus');
let mockEventBus: EventBus = require('../../../../../server/domain/EventBus');

jest.mock('../../../../../server/domain/product/service/TicketBoardIntegration');
const mockIntegration: TicketBoardIntegration  = require('../../../../../server/domain/product/service/TicketBoardIntegration');

beforeAll( () => {
    LogFactory.init(new WinstonLogFactory());
});

describe("on collection started", () => {
    let collectionStartedEvent= new TicketUpdateCollectionStarted(
        TicketUpdateCollection.name,
        TICKET_UPDATE_COLLECTION_ID_FIXTURE,
        1,
        DEV_PROJECT_ID_FIXTURE,
        TICKET_BOARD_ID_FIXTURE,
        DEV_PROJECT_STARTED_ON_FIXTURE,
        new Date(DEV_PROJECT_STARTED_ON_FIXTURE.getDay()+1)
    );

    test("should fetch updated tickets list", () => {
        mockIntegration.getUpdatedTickets = jest.fn().mockImplementationOnce((ticketBoardKey, from, to) => {
            let updatedTickets = [{...UPDATED_TICKET_FIXTURE, created: from, updated: from}];
            return TE.taskEither.of(updatedTickets)
        });

        mockEventBus.publishEvent = jest.fn().mockImplementationOnce(event => {
            return TE.taskEither.of(true)
        });

        let collector = new UpdatedTicketsListCollector(mockEventBus, mockIntegration);
        collector.onEvent(collectionStartedEvent).then(res => {
            expect(mockEventBus.publishEvent).toBeCalledTimes(1);
            expect(mockEventBus.publishEvent).toBeCalledWith(expect.objectContaining({
                _eventType: UpdatedTicketsListFetched.name,
                updatedTickets: expect.arrayContaining([expect.objectContaining({key: TICKET_KEY_FIXTURE})])
            }))
        })
    });

    test("should generate collection failed event when integration client fails", () => {
        let mockErrorMessage = "Some error";
        mockIntegration.getUpdatedTickets = jest.fn().mockImplementationOnce((ticketBoardKey, from, to) => {
            let updatedTickets = [{...UPDATED_TICKET_FIXTURE, created: from, updated: from}];
            return TE.left(T.task.of(new Error(mockErrorMessage)))
        });

        mockEventBus.publishEvent = jest.fn().mockImplementationOnce(event => {
            return TE.taskEither.of(true)
        });

        let collector = new UpdatedTicketsListCollector(mockEventBus, mockIntegration);
        collector.onEvent(collectionStartedEvent).then(res => {
            expect(mockEventBus.publishEvent).toBeCalledTimes(1);
            expect(mockEventBus.publishEvent).toBeCalledWith(expect.objectContaining({
                _eventType: TicketUpdateCollectionFailed.name,
                processor: UpdatedTicketsListCollector.name,
                reason: mockErrorMessage
            }))
        })
    });
});