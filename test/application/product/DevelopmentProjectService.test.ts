import ProductDevelopmentService from "../../../server/application/product/ProductDevelopmentService";
import EventBus from "../../../server/domain/EventBus";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import {PROJECT_INFO_FIXTURE} from "../../domain/product/productFixtures";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import {CreateProjectFromTicketBoard} from "../../../server/application/product/commands";
import ProductDevelopmentRepository from "../../../server/domain/product/repository/ProductDevelopmentRepository";
import TicketBoardIntegration from "../../../server/domain/product/service/TicketBoardIntegration";
import ProductDevelopment from "../../../server/domain/product/ProductDevelopment";

jest.mock('../../../server/domain/EventBus');
jest.mock('../../../server/domain/product/repository/ProductDevelopmentRepository');
jest.mock('../../../server/domain/product/service/TicketBoardIntegration');

let mockEventBus: EventBus = require('../../../server/domain/EventBus');
let mockRepository: ProductDevelopmentRepository = require('../../../server/domain/product/repository/ProductDevelopmentRepository');
let mockIntegration: TicketBoardIntegration = require('../../../server/domain/product/service/TicketBoardIntegration');

mockEventBus.publishEvent = jest.fn().mockImplementation(event => {
    return TE.taskEither.of(true)
});

LogFactory.init(new WinstonLogFactory());
let service: ProductDevelopmentService = new ProductDevelopmentService(mockEventBus, mockRepository, mockIntegration);

beforeAll(() => {

});

describe('create project from ticket board', () => {
    test('should fail if there is already a development project with same ticket board key', async () => {
        jest.mock('../../../server/domain/product/ProductDevelopment');
        const mockProductDevelopment = require('../../../server/domain/product/ProductDevelopment');

        mockRepository.findOneByTicketBoardKey = jest.fn().mockImplementationOnce(key => {
            return TE.taskEither.of(O.some(ProductDevelopment))
        });

        mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
            return TE.taskEither.of(PROJECT_INFO_FIXTURE)
        });

        mockRepository.save = jest.fn().mockImplementationOnce((devProject) => {
            return TE.taskEither.of(devProject)
        });

        let result = await service.createFromTicketBoard(
            new CreateProjectFromTicketBoard("TEST", undefined)).run();

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

        let result = await service.createFromTicketBoard(
            new CreateProjectFromTicketBoard("TEST", new Date("2019-11-27"))).run();

        expect(mockEventBus.publishEvent).toBeCalledTimes(2);
        expect(result.isRight()).toBeTruthy();
        expect(result.value).toEqual(expectedId)
    });
});


