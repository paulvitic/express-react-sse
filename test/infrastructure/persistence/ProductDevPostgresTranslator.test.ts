import LogFactory from "../../../server/domain/LogFactory";
import WinstonLogFactory from "../../../server/infrastructure/context/winstonLogFactory";
import TicketBoard from "../../../server/domain/product/TicketBoard";
import * as translate  from "../../../server/infrastructure/persistence/ProductDevPostgresTranslator";


beforeAll(() => {
    LogFactory.init(new WinstonLogFactory())
});

describe('translate to ticket board', () => {
    test('should fail when result count is not one',() => {
        let queryResult = { rows: [{ id:1 },{id:2}] };
        let ticketBoard = translate.toTicketBoard(queryResult);
        expect(ticketBoard.isLeft()).toBeTruthy();
        let error = ticketBoard.value as Error;
        expect(error.message).toEqual('none or too many results');
    });

    test('should fail when external id or key is not returned', () => {
        let queryResult = { rows: [{ id:1 }] };
        let ticketBoard = translate.toTicketBoard(queryResult);
        expect(ticketBoard.isLeft()).toBeTruthy();
        let error = ticketBoard.value as Error;
        expect(error.message).toEqual('external id or key can not be undefined.');
    });

    test('should fail when no result row is returned', () => {
        let queryResult = { rows: [{}]};
        let ticketBoard = translate.toTicketBoard(queryResult);
        expect(ticketBoard.isLeft()).toBeTruthy();
        let error = ticketBoard.value as Error;
        expect(error.message).toEqual('external id or key can not be undefined.');
    });

    test('should not assert ticket board', () => {
        let queryResult = { rows: [{ id:1, key:"YES", external_ref:1000}] };
        let ticketBoard = translate.toTicketBoard(queryResult);
        expect(ticketBoard.isRight()).toBeTruthy();
        let result = ticketBoard.value as TicketBoard;
        expect(result.id).toEqual(1);
    });
});


