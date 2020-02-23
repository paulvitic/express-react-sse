import DevelopmentProjectService from "../../../server/application/product/DevelopmentProjectService";
import EventBus from "../../../server/domain/EventBus";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {PROJECT_INFO_FIXTURE} from "../../domain/product/productFixtures";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {CreateProjectFromTicketBoard} from "../../../server/application/product/commands";
import DevelopmentProjectRepository from "../../../server/domain/product/repository/DevelopmentProjectRepository";
import TicketBoardIntegration from "../../../server/domain/product/service/TicketBoardIntegration";

jest.mock('../../../server/domain/EventBus');
jest.mock('../../../server/domain/product/repository/DevelopmentProjectRepository');
jest.mock('../../../server/domain/product/service/TicketBoardIntegration');

let mockEventBus: EventBus = require('../../../server/domain/EventBus');
let mockRepository: DevelopmentProjectRepository = require('../../../server/domain/product/repository/DevelopmentProjectRepository');
let mockIntegration: TicketBoardIntegration = require('../../../server/domain/product/service/TicketBoardIntegration');

mockEventBus.publishEvent = jest.fn().mockImplementation(event => {
    return TE.taskEither.of(true)
});

LogFactory.init(new WinstonLogFactory());
let service: DevelopmentProjectService = new DevelopmentProjectService(mockEventBus, mockRepository, mockIntegration);

beforeAll(() => {

});

describe('create project from ticket board', () => {
    test('should fail if there is already a development project with same ticket board key', async () => {
        jest.mock('../../../server/domain/product/DevelopmentProject');
        const mockDevProject = require('../../../server/domain/product/DevelopmentProject');

        mockRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(key => {
            return TE.taskEither.of(O.some(mockDevProject))
        });

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(PROJECT_INFO_FIXTURE)
        });

        mockRepository.save = jest.fn().mockImplementationOnce((devProject) => {
            return TE.taskEither.of(devProject)
        });

        let result = await service.createFromTicketBoard(new CreateProjectFromTicketBoard("TEST")).run();

        expect(mockEventBus.publishEvent).toBeCalledTimes(0);
        expect(result.isLeft).toBeTruthy();
        let error = result.value as Error;
        expect(error.message).toEqual("Ticket board key already exists")
    });

    test('should return new development project id', async () => {
        let expectedId: string;

        mockRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(key => {
            return TE.taskEither.of(O.none)
        });

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(key => {
            return TE.taskEither.of(PROJECT_INFO_FIXTURE)
        });

        mockRepository.save = jest.fn().mockImplementationOnce(devProject => {
            expectedId = devProject.id;
            return TE.taskEither.of(devProject)
        });

        let result = await service.createFromTicketBoard(new CreateProjectFromTicketBoard("TEST")).run();

        expect(mockEventBus.publishEvent).toBeCalledTimes(2);
        expect(result.isRight()).toBeTruthy();
        expect(result.value).toEqual(expectedId)
    });
});


