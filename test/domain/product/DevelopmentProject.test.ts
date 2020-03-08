import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as O from "fp-ts/lib/Option";
import {
    TICKET_BOARD_KEY_FIXTURE,
    PROJECT_INFO_FIXTURE
} from "./productFixtures";
import ProductDevelopment, {DevelopmentProjectError} from "../../../server/domain/product/DevelopmentProject";
import * as E from "fp-ts/lib/Either";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {ProductDevelopmentProjectCreated, TicketBoardLinked} from "../../../server/domain/product/event";
import ProductDevelopmentRepository from "../../../server/domain/product/repository/DevelopmentProjectRepository";
import TicketBoardIntegration from "../../../server/domain/product/service/TicketBoardIntegration";

//jest.disableAutomock();// this is by default disabled.

jest.mock('../../../server/domain/product/repository/DevelopmentProjectRepository');
jest.mock('../../../server/domain/product/service/TicketBoardIntegration');

const mockRepo: ProductDevelopmentRepository = require('../../../server/domain/product/repository/DevelopmentProjectRepository');
const mockIntegration: TicketBoardIntegration = require('../../../server/domain/product/service/TicketBoardIntegration');

beforeAll(() => {
    LogFactory.init(new WinstonLogFactory())
});

describe('create project from ticket board key', () => {

    test("should fail if the key already exists", async () => {
        let mockDevProject: ProductDevelopment = jest.genMockFromModule('../../../server/domain/product/DevelopmentProject');
        ProductDevelopmentRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(() => {
                return TE.taskEither.of(O.some(mockDevProject))
            });

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.fromEither(E.right(PROJECT_INFO_FIXTURE));
        });

        let res = await ProductDevelopment.createFromTicketBoard(TICKET_BOARD_KEY_FIXTURE, ProductDevelopmentRepository, mockIntegration).run();
        expect(res.isLeft()).toBeTruthy();
        let error = res.value as DevelopmentProjectError;
        expect(error.message).toBe("Ticket board key already exists")
    });

    test("should fail if the key does not exists in remote ticket board app", async () => {
        ProductDevelopmentRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(() => {
                return TE.taskEither.of(O.none)
            });

        let expectedErrorMessage = "Assert Error";
        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.leftTask(T.task.of(new Error(expectedErrorMessage)))
        });

        let res = await ProductDevelopment.createFromTicketBoard(TICKET_BOARD_KEY_FIXTURE, ProductDevelopmentRepository, mockIntegration).run();
        expect(res.isLeft()).toBeTruthy();
        let error = res.value as DevelopmentProjectError;
        expect(error.message).toBe(expectedErrorMessage)
    });

    test("should fail if ticket board category is not development project", async () => {
        ProductDevelopmentRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(
            (): TE.TaskEither<Error, O.Option<ProductDevelopment>> => {
                return TE.taskEither.of(O.none)
            });

        let mockProjectInfo = {
            ...PROJECT_INFO_FIXTURE,
            projectCategory: {
                id: 1001,
                name: "Wrong Category",
                description: "",
            }
        };
        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.fromEither(E.right(mockProjectInfo));
        });

        let res = await ProductDevelopment.createFromTicketBoard(TICKET_BOARD_KEY_FIXTURE, ProductDevelopmentRepository, mockIntegration).run();
        expect(res.isLeft()).toBeTruthy();
        let error = res.value as DevelopmentProjectError;
        expect(error.message).toBe("Ticket board is not for a development project")
    });

    test("should fail if project name is undefined", async () => {
        ProductDevelopmentRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(() => {
                return TE.taskEither.of(O.none)
        });

        let mockProjectInfo = {
            ...PROJECT_INFO_FIXTURE,
            name: undefined
        };
        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(mockProjectInfo);
        });

        let res = await ProductDevelopment.createFromTicketBoard(TICKET_BOARD_KEY_FIXTURE, ProductDevelopmentRepository, mockIntegration).run();
        expect(res.isLeft()).toBeTruthy();
        let error = res.value as DevelopmentProjectError;
        expect(error.message).toBe("Can not create a project without a project name")
    });

    test("should succeed with relevant domain events created", async () => {
        ProductDevelopmentRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(
            (): TE.TaskEither<Error, O.Option<ProductDevelopment>> => {
                return TE.taskEither.of(O.none)});

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(PROJECT_INFO_FIXTURE);
        });

        let res = await ProductDevelopment.createFromTicketBoard(TICKET_BOARD_KEY_FIXTURE, ProductDevelopmentRepository, mockIntegration).run();
        expect(res.isRight()).toBeTruthy();
        let devProject = res.value as ProductDevelopment;
        let generatedEvents = devProject.domainEvents;
        expect(generatedEvents.length).toBe(2);
        expect(generatedEvents[0].constructor.name).toEqual(ProductDevelopmentProjectCreated.name);
        expect(generatedEvents[1].constructor.name).toEqual(TicketBoardLinked.name)
    });
});
