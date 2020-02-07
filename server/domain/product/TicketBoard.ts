import AggregateRoot from "../AggregateRoot";
import {TicketBoardCreated} from "./events/TicketBoardCreated";
import DomainEvent from "../DomainEvent";
import TicketBoardIntegration, {TicketBoardInfo} from "./TicketBoardIntegration";
import Identity from "../Identity";
import {pipe} from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import * as O from "fp-ts/lib/Option";
import {TicketBoardRepository} from "./TicketBoardRepository";
import LogFactory from "../LogFactory";

export class TicketBoardCreationFailure extends Error {}

export default class TicketBoard extends AggregateRoot {
    private readonly log = LogFactory.get(TicketBoard.name);
    private readonly _externalId: number;
    private readonly _externalKey: string;
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

    static create = (key: string, repo: TicketBoardRepository, integration: TicketBoardIntegration):
        TE.TaskEither<TicketBoardCreationFailure, TicketBoard> => {
        return pipe(
            TicketBoard.newExternalKey(key, repo),
            TE.chain(TE.fromOption(() => new TicketBoardCreationFailure('External key already exists.'))),
            TE.chain(integration.assertProject),
            TE.map(TicketBoard.fromExternalProjectInfo),
            TE.chain(TE.fromEither)
        )
    };

    private static fromExternalProjectInfo(info: TicketBoardInfo):
        E.Either<TicketBoardCreationFailure,TicketBoard> {
        return E.tryCatch(() => {
            let ticketBoard = new TicketBoard(Identity.generate(), info.id, info.key);

            // TODO add transient data from ticketBoard info to create a Development Project and assign this board to it
            const {projectCategory} = info;
            let event = new TicketBoardCreated(
                TicketBoard.name,
                ticketBoard.id,
                ticketBoard.nextEventSequence(),
                info.id,
                info.key,
                projectCategory);

            ticketBoard.onTicketBoardCreated(event);
            ticketBoard.recordEvent(event);
            return ticketBoard
        }, reason => new TicketBoardCreationFailure(String(reason)))
    };

    private static newExternalKey(key:string, repo:TicketBoardRepository):
        TE.TaskEither<Error, O.Option<string>> {
        return pipe(
            repo.findOneByExternalKey(key),
            TE.map(found => {return found.isSome() ? O.none : O.some(key)})
        )
    }

    private onTicketBoardCreated(event: TicketBoardCreated) {
        this.assertEventSequence(event.sequence);
    }
}
