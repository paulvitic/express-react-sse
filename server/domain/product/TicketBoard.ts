import AggregateRoot from "../AggregateRoot";
import {Except, Failure, Succeed, withFailure, withSuccess} from "../Except";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";
import {QueryService} from "../QueryService";
import TicketBoardIntegration from "./TicketBoardIntegration";

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

    static create(key: string,
                  queryService: QueryService<TicketBoard>,
                  integration: TicketBoardIntegration): Promise<Except<TicketBoardFailure, TicketBoard>> {
        return new Promise<Except<TicketBoardFailure, TicketBoard>>(async (resolve) => {
            if (await queryService.exists(key)) {
                resolve(withFailure({
                    type: "TicketBoardCreationError",
                    reason: `Ticket board ${key} exists` }))
            } else {
                let assert = await integration.assertProject(key);
                // TODO add assert ata to Ticket Board properties
                let ticketBoard = new TicketBoard(key);
                let event = new TicketBoardCreated(
                    TicketBoard.name,
                    key,
                    ticketBoard.nextEventSequence());
                ticketBoard.onTicketBoardCreated(event);
                ticketBoard.recordEvent(event);
                resolve(withSuccess(ticketBoard));
            }
        })
    }

    private onTicketBoardCreated(event: TicketBoardCreated) {
        this.assertEventSequence(event.sequence);
    }
}
