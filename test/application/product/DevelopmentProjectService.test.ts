import DevelopmentProjectService from "../../../server/application/product/DevelopmentProjectService";
import EventBus from "../../../server/domain/EventBus";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {PROJECT_INFO_FIXTURE} from "../../domain/product/productFixtures";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {CreateProjectFromTicketBoard} from "../../../server/application/product/commands";

LogFactory.init(new WinstonLogFactory());

jest.mock('../../../server/domain/EventBus');
let mockEventBus: EventBus = require('../../../server/domain/EventBus');

jest.mock('../../../server/domain/product/DevelopmentProjectRepository');
const mockRepository = require('../../../server/domain/product/repository/DevelopmentProjectRepository');

jest.mock('../../../server/domain/product/TicketBoardIntegration');
const mockIntegration = require('../../../server/domain/product/service/TicketBoardIntegration');

let service: DevelopmentProjectService = new DevelopmentProjectService(mockEventBus, mockRepository, mockIntegration);

describe('create project from ticket board', () => {
    test('should return new development project id', async () => {
        let expectedId: string;

        mockRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(O.none)
        });

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(PROJECT_INFO_FIXTURE)
        });

        mockEventBus.publishEvent = jest.fn().mockImplementation((domainEvent) => {
            return TE.taskEither.of(true)
        });

        mockRepository.save = jest.fn().mockImplementationOnce((devProject) => {
            expectedId = devProject.id;
            return TE.taskEither.of(devProject)
        });

        let result = await service.createFromTicketBoard(new CreateProjectFromTicketBoard("TEST")).run();

        expect(mockEventBus.publishEvent).toBeCalledTimes(2);
        expect(result.isRight()).toBeTruthy();
        expect(result.value).toEqual(expectedId)
    });

    test('should fail if there is already a development project with same ticket board key', async () => {
        jest.mock('../../../server/domain/product/DevelopmentProject');
        const mockDevProject = require('../../../server/domain/product/DevelopmentProject');

        mockRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(O.some(mockDevProject))
        });

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(PROJECT_INFO_FIXTURE)
        });

        mockEventBus.publishEvent = jest.fn().mockImplementation((domainEvent) => {
            return TE.taskEither.of(true)
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
});


