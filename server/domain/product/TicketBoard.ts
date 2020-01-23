import AggregateRoot from "../AggregateRoot";
import {Except, Failure, withFailure, withSuccess} from "../Except";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";
import TicketBoardIntegration from "./TicketBoardIntegration";
import {TicketBoardRepository} from "./TicketBoardRepository";
import Identity from "../Identity";

export class TicketBoardFailure implements Failure<string> {
    reason: string;
    type: string;
}

export default class TicketBoard extends AggregateRoot {
    constructor(id: string,
                private _externalId?: number,
                private _externalKey?: string) {
        super(id);
    }

    get externalId() {
        return this._externalId;
    }

    get externalKey() {
        return this._externalKey;
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
                  repository: TicketBoardRepository,
                  integration: TicketBoardIntegration):
        Promise<Except<TicketBoardFailure, TicketBoard>> {

        return new Promise<Except<TicketBoardFailure, TicketBoard>>(async (resolve) => {
            let ticketBoardWithSameKey = await repository.findOneByExternalKey(key);
            if (ticketBoardWithSameKey) {
                resolve(withFailure({
                    type: "TicketBoardCreationError",
                    reason: `Ticket board ${key} exists` }))

            } else {
                let assertion = await integration.assertProject(key);
                assertion.onSuccess(ticketBoardInfo => {

                    // TODO generate add external ref as jira id and key, build redis hash using these
                    let ticketBoard = new TicketBoard(
                        Identity.generate(),
                        ticketBoardInfo.id,
                        ticketBoardInfo.key);

                    // TODO add transient data from ticketBoard info to create a Development Project and assign this board to it
                    let event = new TicketBoardCreated(
                        TicketBoard.name,
                        ticketBoard.id,
                        ticketBoard.nextEventSequence(),
                        ticketBoardInfo.id,
                        ticketBoardInfo.key);

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
        this._externalId = event.externalId;
        this._externalKey = event.externalKey;
    }
}
