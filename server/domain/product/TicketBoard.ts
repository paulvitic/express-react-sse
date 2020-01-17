import AggregateRoot from "../AggregateRoot";
import {Except, Failure, Succeed, withSuccess} from "../Except";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import Identity from "../Identity";

export class TicketBoardFailure implements Failure<string> {
    reason: string;
    type: string;
}

export default class TicketBoard extends AggregateRoot {
    private key: string;

    static create(key: string): Promise<Except<TicketBoardFailure, TicketBoard>> {
        return new Promise<Except<TicketBoardFailure, TicketBoard>>((resolve) => {
            let boardCanBeCreated = true; // some business logic
            if (boardCanBeCreated) {
                let ticketBoard = new TicketBoard();
                let event = new TicketBoardCreated(
                    TicketBoard.name,
                    Identity.generate(key),
                    ticketBoard.nextEventSequence(),
                    key);
                ticketBoard.mutateWhenTicketBoardCreated(event); // we dont need ths, constructor inititlizes state anyway, just to show as example for other business methods
                ticketBoard.recordEvent(event); // may be constructor records this event too
                resolve(withSuccess(ticketBoard));
            }
        })
    }

    private mutateWhenTicketBoardCreated(event: TicketBoardCreated) {// we shoud not need this mutator as construtor initializes
        this.assertEventSequence(event.sequence)
        this.key = event.key;
    }
}
