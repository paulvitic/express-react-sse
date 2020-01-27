import TicketBoardsService from "../../../server/application/product/TicketBoardsService";
import {TicketBoardRepository} from "../../../server/domain/product/TicketBoardRepository";
import TicketBoardIntegration, {
    TicketBoardInfo,
    TicketBoardIntegrationFailure
} from "../../../server/domain/product/TicketBoardIntegration";
import RabbitEventBus from "../../../server/infrastructure/messaging/RabbitEventBus";
import EventBus from "../../../server/domain/EventBus";
import {fromNullable, Option} from "fp-ts/lib/Option";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import {Either, right} from "fp-ts/lib/Either";
import {PROJECT_INFO_FIXTURE} from "../../domain/product/fixtures";
import Identity from "../../../server/domain/Identity";

// https://klzns.github.io/how-to-use-type-script-and-jest-mocks
// https://patrickdesjardins.com/blog/strongly-typed-mock-with-typescript-and-jest

let mockEventBus: EventBus = {
    publish: jest.fn(),
    subscribe: jest.fn()
};

let mockRepository: TicketBoardRepository = {
    delete: jest.fn(),
    find:  jest.fn(),
    findOne:  jest.fn(),
    findOneByExternalKey: jest.fn(),
    save:  jest.fn(),
    update:  jest.fn()
};

let mockIntegration: TicketBoardIntegration = {
    assertProject: jest.fn()
};

let service: TicketBoardsService = new TicketBoardsService(mockEventBus, mockRepository, mockIntegration);

test('should not find ticket board', async () => {
    const expectedId = Identity.generate();
    mockRepository.findOneByExternalKey = jest.fn().mockImplementationOnce(() => {
        return new Promise<Option<TicketBoard>>(resolve=> {
            resolve(fromNullable(null))
        })
    });
    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return new Promise<Either<Error, TicketBoardInfo>>(resolve=> {
            resolve(right(PROJECT_INFO_FIXTURE))
        })
    });
    mockEventBus.publish = jest.fn(() => {
        return new Promise<boolean>(resolve => {
            resolve(true)
        })
    });
    mockRepository.save = jest.fn().mockImplementationOnce(() => {
        return new Promise<Either<Error, TicketBoard>>(resolve=> {
            resolve(right(new TicketBoard(expectedId, 1000,"TEST")))
        })
    });

    let ticketBoardId = await service.addTicketBoard({key: "TEST", type: "MockCommand"});
    expect(ticketBoardId.value).toEqual(expectedId)
});
