import TicketBoardsService from "../../../server/application/product/TicketBoardsService";
import {TicketBoardRepository} from "../../../server/domain/product/TicketBoardRepository";
import TicketBoardIntegration, {
    TicketBoardInfo
} from "../../../server/domain/product/TicketBoardIntegration";
import EventBus from "../../../server/domain/EventBus";
import {fromNullable, Option} from "fp-ts/lib/Option";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import {PROJECT_INFO_FIXTURE} from "../../domain/product/productFixtures";
import Identity from "../../../server/domain/Identity";
import {pipe} from "fp-ts/lib/pipeable";
import AddTicketBoard from "../../../server/application/product/commands/AddTicketBoard";

let mockEventBus: EventBus = {
    publishEvent: jest.fn(),
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
        return TE.tryCatch(() => {
            return new Promise<Option<TicketBoard>>(resolve=> {
                resolve(fromNullable(null))
            })
        }, reason => new Error(String(reason)))
    });

    mockIntegration.assertProject = jest.fn().mockImplementationOnce(() => {
        return TE.tryCatch(() => {
            return new Promise<TicketBoardInfo>(resolve => {
                resolve(PROJECT_INFO_FIXTURE)
            })
        }, reason => new Error(String(reason)))

    });

    mockEventBus.publishEvent = jest.fn(() => {
        return TE.tryCatch(() => {
            return new Promise<boolean>(resolve => {
                resolve(true)
            })
        }, reason => new Error(String(reason)))
    });

    mockRepository.save = jest.fn().mockImplementationOnce(() => {
        return TE.tryCatch(() => {
            return new Promise<TicketBoard>(resolve=> {
                resolve(new TicketBoard(expectedId, 1000,"TEST"))
            })
        }, reason => new Error(String(reason)))
    });

    let addTicketBoardTask = service.addTicketBoard(new AddTicketBoard("TEST"));

    addTicketBoardTask.run()
        .then(ticketBoardId => {
            expect(ticketBoardId.value).toEqual(expectedId)
        }).catch(reason =>
            expect(reason).toBeNull()
        );
});

test("test for fold", () => {
    function onLeft(errors: Array<string>): string {
        return `Errors: ${errors.join(', ')}`
    }

    function onRight(value: number): string {
        return `Ok: ${value}`
    }

    let res = pipe(
        E.right(1),
        E.fold(onLeft, onRight)
    );
    expect(res).toEqual('Ok: 1');

    let res2 = pipe(
        E.left(['error 1', 'error 2']),
        E.fold(onLeft, onRight)
    );
    expect(res2).toEqual('Errors: error 1, error 2')
});
