import {translateToTicketBoard} from "../../../server/infrastructure/persistence/QueryResultTranslator";
import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";

beforeAll(() => {
    LogFactory.init(new WinstonLogFactory())
});

test('should not assert ticket board',() => {
    let queryResult = { rows: [{ id:1 },{id:2}] };
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isLeft()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: none or too many results)');
});

test('should not assert ticket board', () => {
    let queryResult = { rows: [{ id:1 }] };
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isLeft()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: external id or key can not be undefined.)');
});

test('should not assert ticket board', () => {
    let queryResult = { rows: [{}]};
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isLeft()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: external id or key can not be undefined.)');
});

test('should not assert ticket board', () => {
    let queryResult = { rows: [{ id:1, external_id:"YES", external_key:"TEST"}] };
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isRight()).toBe(true);
    if (ticketBoard.isRight()) {
        expect(ticketBoard.value.id).toEqual(1);
    }
});
