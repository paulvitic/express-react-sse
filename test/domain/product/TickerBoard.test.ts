import TicketBoardIntegration from "../../../server/domain/product/TicketBoardIntegration";
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import {EXTERNAL_KEY_FIXTURE, PROJECT_INFO_FIXTURE} from "./fixtures";
import TicketBoard from "../../../server/domain/product/TicketBoard";

let mockIntegration: TicketBoardIntegration = {
    assertProject: jest.fn()
};

test('should create ticket board', async () => {
    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.fromEither(E.right(PROJECT_INFO_FIXTURE));
    });

    TicketBoard.create(EXTERNAL_KEY_FIXTURE, mockIntegration)
        .run()
        .then(created => {
            expect(created.isRight()).toBe(true);
            if (created.isRight()){
                let ticketBoard = created.value;
                expect(ticketBoard.externalKey).toEqual(EXTERNAL_KEY_FIXTURE)
            }
        });
});

test('should not create ticket board', async () => {
    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.fromEither(E.left(new Error("fixture error message")));
    });

    TicketBoard.create(EXTERNAL_KEY_FIXTURE, mockIntegration)
        .run()
        .then(created => {
            expect(created.isRight()).toBe(false);
            if (created.isLeft()){
                let ticketBoard = created.value;
                expect(ticketBoard.message).toEqual("fixture error message")
            }
        });
});
