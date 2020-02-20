import TicketUpdateCollection from "../../../server/domain/product/TicketUpdateCollection";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import {NextTicketUpdateCollectionPeriod} from "../../../server/domain/product/view/NextTicketUpdateCollectionPeriod";
import {DEV_PROJECT_ID_FIXTURE, TICKET_BOARD_KEY_FIXTURE} from "./productFixtures";

describe("create", () => {
    test("", () => {
        let created = TicketUpdateCollection.create(O.none);
        expect(created.isLeft()).toBeTruthy()
    });

    test("", () => {
        let created = TicketUpdateCollection.create(
            O.some(new NextTicketUpdateCollectionPeriod(
                DEV_PROJECT_ID_FIXTURE,
                TICKET_BOARD_KEY_FIXTURE,
                new Date(),
                new Date())));
        expect(created.isLeft()).toBeTruthy()
    })
});
