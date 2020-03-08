import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import EventBus from "../../../../../server/domain/EventBus";
import TicketUpdateCollection from "../../../../../server/domain/product/TicketUpdateCollection";
import {
    PRODUCT_DEV_ID_FIXTURE,
    TICKET_BOARD_KEY_FIXTURE, TICKET_CHANGELOG_0,
    TICKET_KEY_FIXTURE_0,
    TICKET_UPDATE_COLLECTION_ID_FIXTURE,
    TICKET_UPDATE_COLLECTION_PERIOD_FIXTURE,
    UPDATED_TICKET_FIXTURE_0,
    UPDATED_TICKET_FIXTURE_1
} from "../../productFixtures";
import TicketBoardIntegration, {
    TicketBoardIntegrationFailure, TicketChangeLog
} from "../../../../../server/domain/product/service/TicketBoardIntegration";
import LogFactory from "../../../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../../../server/infrastructure/context/winstonLogFactory";
import {UpdatedTicketsListFetched,TicketChanged, TicketRemainedUnchanged} from "../../../../../server/domain/product/event";
import TicketChangeLogReader
    from "../../../../../server/domain/product/process/ticketUpdateCollection/TicketChangeLogReader";
import {TaskEither} from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

jest.mock('../../../../../server/domain/EventBus');
jest.mock('../../../../../server/domain/product/service/TicketBoardIntegration');

let mockEventBus: EventBus = require('../../../../../server/domain/EventBus');
const mockIntegration: TicketBoardIntegration  = require('../../../../../server/domain/product/service/TicketBoardIntegration');

let reader: TicketChangeLogReader;

beforeAll( () => {
    LogFactory.init(new WinstonLogFactory());
    reader = new TicketChangeLogReader(mockEventBus, mockIntegration);
});

describe("on collection started", () => {
    let updatedTicketsListFetched = new UpdatedTicketsListFetched(
        TicketUpdateCollection.name,
        TICKET_UPDATE_COLLECTION_ID_FIXTURE,
        PRODUCT_DEV_ID_FIXTURE,
        TICKET_BOARD_KEY_FIXTURE,
        TICKET_UPDATE_COLLECTION_PERIOD_FIXTURE,
        [UPDATED_TICKET_FIXTURE_0, UPDATED_TICKET_FIXTURE_1]
    );

    test("should publish", () => {
        mockIntegration.readTicketChangeLog = jest.fn().mockImplementation((ticketKey):
        TaskEither<TicketBoardIntegrationFailure, O.Option<TicketChangeLog>> => {
            return ticketKey === TICKET_KEY_FIXTURE_0 ?
                TE.rightTask(T.task.of(O.some(TICKET_CHANGELOG_0))) :
                TE.rightTask(T.task.of(O.none))
        });

        mockEventBus.publishEvent = jest.fn().mockImplementation(() => {
            return TE.taskEither.of(true)
        });

        reader.onEvent(updatedTicketsListFetched).then(() => {
            expect(mockEventBus.publishEvent).toBeCalledTimes(2);
            expect(mockEventBus.publishEvent).toHaveBeenNthCalledWith(1,
                expect.objectContaining({
                    _eventType: TicketChanged.name,
                }));
            expect(mockEventBus.publishEvent).toHaveBeenNthCalledWith(2,
                expect.objectContaining({
                    _eventType: TicketRemainedUnchanged.name,
                }))
        })
    });
});
