import AggregateRoot from "../AggregateRoot";
import {Except, Failure, Succeed, withSuccess} from "../Except";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";

export class TicketBoardFailure implements Failure<string> {
    reason: string;
    type: string;
}

export default class TicketBoard extends AggregateRoot {

    static fromEvents(id: string, events: DomainEvent[]): TicketBoard {
        const dataCollection = new TicketBoard(id);
        for (let event of events){
            switch (event.eventType) {
                case TicketBoardCreated.name:
                    dataCollection.onTicketBoardCreated(event as TicketBoardCreated);
                    break;
                default:
            }
        }
        return dataCollection;
    }

    static create(key: string): Promise<Except<TicketBoardFailure, TicketBoard>> {
        return new Promise<Except<TicketBoardFailure, TicketBoard>>((resolve) => {
            let boardCanBeCreated = true; // some business logic
            if (boardCanBeCreated) {
                let ticketBoard = new TicketBoard(key);
                let event = new TicketBoardCreated(
                    TicketBoard.name,
                    key,
                    ticketBoard.nextEventSequence());
                ticketBoard.onTicketBoardCreated(event); // we dont need ths, constructor inititlizes state anyway, just to show as example for other business methods
                ticketBoard.recordEvent(event); // may be constructor records this event too
                resolve(withSuccess(ticketBoard));
            }
        })
    }

    private onTicketBoardCreated(event: TicketBoardCreated) { // we shoud not need this mutator as construtor initializes
        this.assertEventSequence(event.sequence);
    }
}
