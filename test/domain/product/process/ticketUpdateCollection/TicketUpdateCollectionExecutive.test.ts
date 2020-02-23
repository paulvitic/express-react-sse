import EventBus from "../../../../../server/domain/EventBus";
import TicketUpdateCollectionRepository from "../../../../../server/domain/product/repository/TicketUpdateCollectionRepository";
import {TicketUpdateCollectionExecutive} from "../../../../../server/domain/product/process/ticketUpdateCollection/TicketUpdateCollectionExecutive";
import {DEV_PROJECT_STARTED_ON_FIXTURE, NEXT_COLLECTION_PERIOD_FIXTURE} from "../../productFixtures";
import * as TE from "fp-ts/lib/TaskEither";
import {TicketUpdateCollectionStarted} from "../../../../../server/domain/product/event/TicketUpdateCollectionStarted";
import TicketUpdateCollection, {TicketUpdateCollectionPeriod} from "../../../../../server/domain/product/TicketUpdateCollection";

jest.mock('../../../../../server/domain/EventBus');
jest.mock('../../../../../server/domain/product/repository/TicketUpdateCollectionRepository');

let mockEventBus: EventBus = require('../../../../../server/domain/EventBus');
let mockCollectionRepo: TicketUpdateCollectionRepository = require('../../../../../server/domain/product/repository/TicketUpdateCollectionRepository');

let collection: TicketUpdateCollection;
mockCollectionRepo.save = jest.fn().mockImplementation(ticketUpdateCollection => {
    collection = ticketUpdateCollection;
    return TE.taskEither.of(ticketUpdateCollection)
});

let collectionStartedEvent: TicketUpdateCollectionStarted;
mockEventBus.publishEvent = jest.fn().mockImplementation(event => {
    collectionStartedEvent = event;
    return TE.taskEither.of(true)
});

let executive = new TicketUpdateCollectionExecutive(mockCollectionRepo, mockEventBus);

beforeEach(() => {
    //jest.resetAllMocks()
});

describe("start", () => {
    test("should create using project start date as beginning of data collection period", () => {
        mockCollectionRepo.findByStatus = jest.fn().mockImplementationOnce(status => {
            return TE.taskEither.of([])
        });

        executive.start(NEXT_COLLECTION_PERIOD_FIXTURE).run()
            .then(result => {
                expect(result.isRight()).toBeTruthy();
                expect(mockCollectionRepo.save).toBeCalledTimes(1);
                expect(mockEventBus.publishEvent).toBeCalledTimes(1);
                expect(mockEventBus.publishEvent).toBeCalledWith(collectionStartedEvent);
                expect(collectionStartedEvent.period).toEqual(new TicketUpdateCollectionPeriod(
                    new Date(DEV_PROJECT_STARTED_ON_FIXTURE),
                    new Date(DEV_PROJECT_STARTED_ON_FIXTURE.getDay()+1)))
            }).catch( e =>
                expect(e).toBeNull()
            );
    });

    test("should not create if there is a collection already running", () => {
        mockCollectionRepo.findByStatus = jest.fn().mockImplementationOnce(status => {
            return TE.taskEither.of([{}])
        });

        executive.start(NEXT_COLLECTION_PERIOD_FIXTURE).run()
            .then(result => {
                expect(result.isLeft()).toBeTruthy();
                let error = result.value as Error;
                expect(error.message).toEqual("A ticket update collection is already running.");
                expect(mockCollectionRepo.save).toBeCalledTimes(1); // These calls are from previous test case
                expect(mockEventBus.publishEvent).toBeCalledTimes(1);
            }).catch( e =>
                expect(e).toBeNull()
            );
    })
});
