import EventBus from "../../../../../server/domain/EventBus";
import TicketUpdateCollectionRepository from "../../../../../server/domain/product/repository/TicketUpdateCollectionRepository";
import {TicketUpdateCollectionExecutive} from "../../../../../server/domain/product/process/ticketUpdateCollection/TicketUpdateCollectionExecutive";
import {DEV_PROJECT_STARTED_ON_FIXTURE, NEXT_COLLECTION_PERIOD_FIXTURE} from "../../productFixtures";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as O from "fp-ts/lib/Option";
import {TicketUpdateCollectionStarted} from "../../../../../server/domain/product/event/TicketUpdateCollectionStarted";
import TicketUpdateCollection from "../../../../../server/domain/product/TicketUpdateCollection";

jest.mock('../../../../../server/domain/EventBus');
let mockEventBus: EventBus = require('../../../../../server/domain/EventBus');

jest.mock('../../../../../server/domain/product/repository/TicketUpdateCollectionRepository');
let mockCollectionRepo: TicketUpdateCollectionRepository = require('../../../../../server/domain/product/repository/TicketUpdateCollectionRepository');

describe("start", () => {
    test("should create using project start date as beginning of data collection period", () => {

        mockCollectionRepo.findByStatus = jest.fn().mockImplementationOnce(devProjectId => {
            return TE.taskEither.of([])
        });

        let collection: TicketUpdateCollection;
        mockCollectionRepo.save = jest.fn().mockImplementationOnce(ticketUpdateCollection => {
            collection = ticketUpdateCollection;
            return TE.taskEither.of(ticketUpdateCollection)
        });

        let collectionStartedEvent: TicketUpdateCollectionStarted;
        mockEventBus.publishEvent = jest.fn().mockImplementationOnce(event => {
            collectionStartedEvent = event;
            return TE.taskEither.of(true)
        });

        let executive = new TicketUpdateCollectionExecutive(mockCollectionRepo, mockEventBus);
        let result = executive.start(NEXT_COLLECTION_PERIOD_FIXTURE).run()
            .then(result => {
                expect(result.isRight()).toBeTruthy();
                expect(mockEventBus.publishEvent).toBeCalledWith(collectionStartedEvent);
                expect(collectionStartedEvent.from).toEqual(new Date(DEV_PROJECT_STARTED_ON_FIXTURE));
                expect(collectionStartedEvent.to).toEqual(new Date(DEV_PROJECT_STARTED_ON_FIXTURE.getDay()+1))
        });
    });

    test("should not create if there is a collection already running", () => {

        mockCollectionRepo.findByStatus = jest.fn().mockImplementationOnce(devProjectId => {
            return TE.taskEither.of([{}])
        });

        mockCollectionRepo.save = jest.fn().mockImplementationOnce(ticketUpdateCollection => {
            return TE.taskEither.of(ticketUpdateCollection)
        });

        mockEventBus.publishEvent = jest.fn().mockImplementationOnce(event => {
            return TE.taskEither.of(false)
        });

        let executive = new TicketUpdateCollectionExecutive(mockCollectionRepo, mockEventBus);
        let result = executive.start(NEXT_COLLECTION_PERIOD_FIXTURE).run()
            .then(result => {
                expect(result.isLeft()).toBeTruthy();
                let error = result.value as Error;
                expect(error.message).toEqual("A ticket update collection is already running.");
                expect(mockCollectionRepo.save).not.toBeCalled();
                expect(mockEventBus.publishEvent).not.toBeCalled()
            });
    })
});
