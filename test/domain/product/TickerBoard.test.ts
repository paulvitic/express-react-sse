import TicketBoardIntegration from "../../../server/domain/product/TicketBoardIntegration";
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import {EXTERNAL_KEY_FIXTURE, PROJECT_INFO_FIXTURE} from "./productFixtures";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import {TicketBoardRepository} from "../../../server/domain/product/TicketBoardRepository";

let mockIntegration: TicketBoardIntegration = {
    assertProject: jest.fn()
};

let mockRepo: TicketBoardRepository = {
    delete: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneByExternalKey: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
};

test('should create ticket board', async () => {
    mockRepo.findOneByExternalKey = jest.fn().mockImplementationOnce(() => {
        return TE.taskEither.of<Error, O.Option<string>>(O.none)
    });

    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.fromEither(E.right(PROJECT_INFO_FIXTURE));
    });

    TicketBoard.create(EXTERNAL_KEY_FIXTURE, mockRepo, mockIntegration)
        .run()
        .then(created => {
            expect(created.isRight()).toBe(true);
            if (created.isRight()){
                let ticketBoard = created.value;
                expect(ticketBoard.externalKey).toEqual(EXTERNAL_KEY_FIXTURE)
            }
        });
});

test('should not create project when on integration failure', async () => {
    mockRepo.findOneByExternalKey = jest.fn().mockImplementationOnce(() => {
        return TE.tryCatch(
            () => new Promise<O.Option<string>>(resolve => resolve(O.none)),
            reason => new Error(String(reason)))
    });

    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.fromEither(E.left(new Error("fixture error message")));
    });

    TicketBoard.create(EXTERNAL_KEY_FIXTURE, mockRepo, mockIntegration)
        .run()
        .then(created => {
            expect(created.isRight()).toBe(false);
            if (created.isLeft()){
                let ticketBoard = created.value;
                expect(ticketBoard.message).toEqual("fixture error message")
            }
        });
});

test('should not create project when key exists', async () => {
    mockRepo.findOneByExternalKey = jest.fn().mockImplementationOnce(() => {
        return TE.tryCatch(
            () => new Promise<O.Option<string>>(resolve => resolve(O.some(EXTERNAL_KEY_FIXTURE))),
            reason => new Error(String(reason)))
    });

    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.fromEither(E.left(new Error("fixture error message")));
    });

    TicketBoard.create(EXTERNAL_KEY_FIXTURE, mockRepo, mockIntegration)
        .run()
        .then(created => {
            expect(created.isRight()).toBe(false);
            if (created.isLeft()){
                let ticketBoard = created.value;
                expect(ticketBoard.message).toEqual("External key already exists.")
            }
        }).catch(err => {
            expect(err).toBeNull()
    })
});
