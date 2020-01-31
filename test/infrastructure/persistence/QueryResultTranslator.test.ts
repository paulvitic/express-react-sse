import {translateToTicketBoard} from "../../../server/infrastructure/persistence/QueryResultTranslator";


test('should not assert ticket board',() => {
    let queryResult = { rows: [{ id:1 },{id:2}] };
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isLeft()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: too many results)');
});

test('should not assert ticket board', () => {
    let queryResult = { rows: [{ id:1 }] };
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isLeft()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: external id or key can not be undefined.)');
});

test('should not assert ticket board', () => {
    let queryResult = {};
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isLeft()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: external id or key can not be undefined.)');
});

test('should not assert ticket board', () => {
    let queryResult = { rows: [{ id:1, external_id:"YES", external_key:"TEST"}] };
    let ticketBoard = translateToTicketBoard(queryResult);
    expect(ticketBoard.isRight()).toBe(true);
    expect(ticketBoard.inspect()).toEqual('left(Error: external id or key can not be undefined.)');
});
