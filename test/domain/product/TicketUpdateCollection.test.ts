import TicketUpdateCollection from "../../../server/domain/product/TicketUpdateCollection";
import {NEXT_COLLECTION_PERIOD_FIXTURE} from "./productFixtures";

describe("create", () => {
    test("should succeed", () => {
        let created = TicketUpdateCollection.create(NEXT_COLLECTION_PERIOD_FIXTURE);
        expect(created.isRight()).toBeTruthy()
    });

    test("should fail when development project is not linked to a ticket board", () => {
        let mockNextCollectionPeriod = {
            ...NEXT_COLLECTION_PERIOD_FIXTURE,
            ticketBoardKey: null
        };
        let created = TicketUpdateCollection.create(mockNextCollectionPeriod);
        expect(created.isLeft()).toBeTruthy();
        let error = created.value as Error;
        expect(error.message).toEqual("Development Project is not linked to a ticket board")
    });
});
