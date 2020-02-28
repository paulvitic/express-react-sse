import EventBus from "../../../../../server/domain/EventBus";
import TicketUpdateCollectionRepository from "../../../../../server/domain/product/repository/TicketUpdateCollectionRepository";
import {TicketUpdateCollectionTracker} from "../../../../../server/domain/product/process/ticketUpdateCollection/TicketUpdateCollectionTracker";
import {
    DEV_PROJECT_STARTED_ON_FIXTURE,
    NEXT_COLLECTION_PERIOD_FIXTURE,
    UPDATED_TICKETS_LIST_FETCHED_FIXTURE
} from "../../productFixtures";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import {TicketUpdateCollectionStarted} from "../../../../../server/domain/product/event";
import TicketUpdateCollection, {TicketUpdateCollectionPeriod} from "../../../../../server/domain/product/TicketUpdateCollection";
import * as E from "fp-ts/lib/Either";

jest.mock('../../../../../server/domain/EventBus');
jest.mock('../../../../../server/domain/product/repository/TicketUpdateCollectionRepository');

let mockEventBus: EventBus = require('../../../../../server/domain/EventBus');
let mockCollectionRepo: TicketUpdateCollectionRepository = require('../../../../../server/domain/product/repository/TicketUpdateCollectionRepository');

let savedMockCollection: TicketUpdateCollection;

describe("start", () => {
    afterEach(() => {

    });

    test("should create using project start date as beginning of data collection period", () => {
        mockCollectionRepo.findByStatus = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of([])
        });

        let collectionStartedEvent: TicketUpdateCollectionStarted;
        mockEventBus.publishEvent = jest.fn().mockImplementation(event => {
            collectionStartedEvent = event;
            return TE.taskEither.of(true)
        });

        let executive = new TicketUpdateCollectionTracker(mockCollectionRepo, mockEventBus);
        executive.start(NEXT_COLLECTION_PERIOD_FIXTURE).run()
            .then(result => {
                expect(result.isRight()).toBeTruthy();

                expect(mockCollectionRepo.save).toBeCalledTimes(1);
                (mockCollectionRepo.save as jest.Mock).mockClear();

                expect(mockEventBus.publishEvent).toBeCalledTimes(1);
                expect(mockEventBus.publishEvent).toBeCalledWith(collectionStartedEvent);
                (mockEventBus.publishEvent as jest.Mock).mockClear();

                expect(collectionStartedEvent.period).toEqual(new TicketUpdateCollectionPeriod(
                    DEV_PROJECT_STARTED_ON_FIXTURE,
                    new Date(DEV_PROJECT_STARTED_ON_FIXTURE.getDay()+1)))
            }).catch( e =>
                expect(e).toBeNull()
            );
    });

    test("should not create if there is a collection already running", () => {
        mockCollectionRepo.findByStatus = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of([{}])
        });

        let executive = new TicketUpdateCollectionTracker(mockCollectionRepo, mockEventBus);
        executive.start(NEXT_COLLECTION_PERIOD_FIXTURE).run()
            .then(result => {
                expect(result.isLeft()).toBeTruthy();
                let error = result.value as Error;
                expect(error.message).toEqual("A ticket update collection is already running.");
                expect(mockCollectionRepo.save).toBeCalledTimes(0);
                (mockCollectionRepo.save as jest.Mock).mockClear();
                expect(mockEventBus.publishEvent).toBeCalledTimes(0);
                (mockEventBus.publishEvent as jest.Mock).mockClear();
            }).catch( e =>
                expect(e).toBeNull()
            );
    })
});


describe("on event", () => {
    jest.mock('../../../../../server/domain/product/TicketUpdateCollection');
    let mockCollection: TicketUpdateCollection = require("../../../../../server/domain/product/TicketUpdateCollection");

    mockEventBus.publishEvent = jest.fn().mockImplementation(() => {
        return TE.taskEither.of(true)
    });

    mockCollectionRepo.save = jest.fn().mockImplementation(ticketUpdateCollection => {
        savedMockCollection = ticketUpdateCollection;
        return TE.taskEither.of(ticketUpdateCollection)
    });

    test("updated tickets fetched should handle successfully", () => {
        mockCollection.willRunForTickets = jest.fn().mockImplementationOnce(() => {
            return E.either.of(null)
        });

        mockCollectionRepo.findLatestByProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(O.some(mockCollection))
        });

        let executive = new TicketUpdateCollectionTracker(mockCollectionRepo, mockEventBus);
        executive.onEvent(UPDATED_TICKETS_LIST_FETCHED_FIXTURE)
            .then(result => {
                expect(result).not.toBeNull();
                expect(result.isRight()).toBeTruthy();
                expect(mockCollectionRepo.save).toBeCalledTimes(1);
                (mockCollectionRepo.save as jest.Mock).mockClear();
                expect(mockEventBus.publishEvent).toBeCalledTimes(0);
                (mockEventBus.publishEvent as jest.Mock).mockClear();
            }).catch( e =>
                expect(e).toBeNull()
        );
    });
});
