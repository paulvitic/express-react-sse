import AggregateRoot from "../AggregateRoot";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";
import TicketBoardIntegration, {TicketBoardInfo, TicketBoardIntegrationFailure} from "./TicketBoardIntegration";
import Identity from "../Identity";
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'

export class TicketBoardFailure extends Error {}

export default class TicketBoard extends AggregateRoot {
    private _externalId: number;
    private _externalKey: string;
    constructor(id: string,
                externalId: number,
                externalKey: string) {
        super(id);
        if (!externalId || !externalKey) throw new Error("external id or key can not be undefined.");
        this._externalId = externalId;
        this._externalKey = externalKey;
    }

    get externalId() {
        return this._externalId;
    }

    get externalKey() {
        return this._externalKey;
    }

    static fromEvents(id: string, events: DomainEvent[]): TicketBoard {
        let dataCollection = null;
        for (let event of events){
            switch (event.eventType) {
                case TicketBoardCreated.name:
                    let createdEvent = event as TicketBoardCreated;
                    dataCollection = new TicketBoard(
                        createdEvent.aggregateId,
                        createdEvent.externalId,
                        createdEvent.externalKey);
                    break;
                default:
            }
        }
        return dataCollection;
    }

    static create = (key: string, integration: TicketBoardIntegration):
        TE.TaskEither<TicketBoardFailure, TicketBoard> => {
        return pipe(
            integration.assertProject(key),
            TE.map(TicketBoard.createFromProjectInfo)
        )
    };

    // TODO could return TaskEither in case there was some exception during creation
    private static createFromProjectInfo = (info: TicketBoardInfo): TicketBoard => {
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
        return ticketBoard
    };

    private onTicketBoardCreated(event: TicketBoardCreated) {
        this.assertEventSequence(event.sequence);
    }
}
