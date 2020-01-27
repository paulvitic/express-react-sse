import AggregateRoot from "../AggregateRoot";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";
import TicketBoardIntegration from "./TicketBoardIntegration";
import Identity from "../Identity";
import {Either, left, right} from "fp-ts/lib/Either";

export class TicketBoardFailure extends Error {}

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
                  integration: TicketBoardIntegration):
        Promise<Either<TicketBoardFailure, TicketBoard>> {

        return new Promise<Either<TicketBoardFailure, TicketBoard>>(async (resolve) => {
                let assertion = await integration.assertProject(key);
                if (assertion.isRight()) {
                    let info = assertion.value;
                    let ticketBoard = new TicketBoard(
                        Identity.generate(),
                        info.id,
                        info.key);

                    // TODO add transient data from ticketBoard info to create a Development Project and assign this board to it
                    let event = new TicketBoardCreated(
                        TicketBoard.name,
                        ticketBoard.id,
                        ticketBoard.nextEventSequence(),
                        info.id,
                        info.key);

                    ticketBoard.onTicketBoardCreated(event);
                    ticketBoard.recordEvent(event);

                    resolve(right(ticketBoard));
                } else {
                    resolve(left(new TicketBoardFailure(assertion.value.message)));
                }
        })
    }

    private onTicketBoardCreated(event: TicketBoardCreated) {
        this.assertEventSequence(event.sequence);
        this._externalId = event.externalId;
        this._externalKey = event.externalKey;
    }
}
