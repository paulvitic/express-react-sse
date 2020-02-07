import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import {
    EXTERNAL_KEY_FIXTURE,
    PROJECT_INFO_FIXTURE
} from "./productFixtures";
import DevelopmentProject, {DevelopmentProjectError} from "../../../server/domain/product/DevelopmentProject";
import * as E from "fp-ts/lib/Either";

//jest.disableAutomock();// this is by default disabled.

jest.mock('../../../server/domain/product/DevelopmentProjectRepository');
const mockRepo = require('../../../server/domain/product/DevelopmentProjectRepository');

jest.mock('../../../server/domain/product/TicketBoardIntegration');
const mockIntegration = require('../../../server/domain/product/TicketBoardIntegration');

test("should not create project from ticket board key if the key already exists",
    async () => {
            let mockDevProject: DevelopmentProject = jest.genMockFromModule('../../../server/domain/product/DevelopmentProject');

            mockRepo.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(
                (arg): TE.TaskEither<Error, O.Option<DevelopmentProject>> => {
                    return TE.tryCatch(
                    () => new Promise<O.Option<DevelopmentProject>>(resolve => resolve(O.some(mockDevProject))),
                    reason => new Error(String(reason)))
            });

            mockIntegration.assertProject = jest.fn().mockImplementationOnce((arg) => {
                return TE.fromEither(E.right(PROJECT_INFO_FIXTURE));
            });

            let res = await DevelopmentProject.createFromTicketBoard(EXTERNAL_KEY_FIXTURE, mockRepo, mockIntegration).run();
            expect(res.isLeft()).toBe(true);
            if (res.isLeft()) {
                let error = res.value as DevelopmentProjectError;
                expect(error.message).toBe("Ticket board key already exists")
        }
});


test("should not create project from ticket board key if the key does not exists in remote ticket board app",
    async () => {
            let mockDevProject: DevelopmentProject = jest.genMockFromModule('../../../server/domain/product/DevelopmentProject');

            mockRepo.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(
                (arg): TE.TaskEither<Error, O.Option<DevelopmentProject>> => {
                    return TE.tryCatch(
                        (): Promise<O.Option<DevelopmentProject>> => new Promise(resolve => resolve(O.none)),
                        reason => new Error(String(reason)))
                });

            let expectedErrorMessage = "Assert Error";
            mockIntegration.assertProject = jest.fn().mockImplementationOnce((arg) => {
                return TE.fromEither(E.left(new Error(expectedErrorMessage)));
            });

            let res = await DevelopmentProject.createFromTicketBoard(EXTERNAL_KEY_FIXTURE, mockRepo, mockIntegration).run();
            expect(res.isLeft()).toBe(true);
            if (res.isLeft()) {
                let error = res.value as DevelopmentProjectError;
                expect(error.message).toBe(expectedErrorMessage)
        }
});

test("should not create project from ticket board key if the key does not exists in remote ticket board app", () => {

});
