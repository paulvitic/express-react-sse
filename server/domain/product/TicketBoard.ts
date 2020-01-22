import AggregateRoot from "../AggregateRoot";
import {Except, Failure, withFailure, withSuccess} from "../Except";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";
import {QueryService} from "../QueryService";
import TicketBoardIntegration from "./TicketBoardIntegration";

export class TicketBoardFailure implements Failure<string> {
    reason: string;
    type: string;
}

export default class TicketBoard extends AggregateRoot {

    constructor(id: string,
                private key?: string,
                private externalRefId?: string) {
        super(id);
    }


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
                  integration: TicketBoardIntegration):
        Promise<Except<TicketBoardFailure, TicketBoard>> {

        return new Promise<Except<TicketBoardFailure, TicketBoard>>(async (resolve) => {
            if (await queryService.exists(key)) {
                resolve(withFailure({
                    type: "TicketBoardCreationError",
                    reason: `Ticket board ${key} exists` }))

            } else {
                let assertion = await integration.assertProject(key);
                assertion.onSuccess(ticketBoardInfo => {

                    // TODO generate add external ref as jira id and key, build redis hash using these
                    let ticketBoard = new TicketBoard(
                        ticketBoardInfo.id,
                        ticketBoardInfo.key);

                    // TODO add transient data from ticketBoard info to create a Development Project and assign this board to it
                    let event = new TicketBoardCreated(
                        TicketBoard.name,
                        ticketBoard.id,
                        ticketBoard.nextEventSequence(),
                        key);

                    ticketBoard.onTicketBoardCreated(event);
                    ticketBoard.recordEvent(event);

                    resolve(withSuccess(ticketBoard));

                }).else(failure => {
                    resolve(withFailure(failure));
                })
            }
        })
    }

    private onTicketBoardCreated(event: TicketBoardCreated) {
        this.assertEventSequence(event.sequence);
        this.key = event.key;
    }
}
