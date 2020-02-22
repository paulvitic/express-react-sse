import AggregateRoot from "../AggregateRoot";
import Identity from "../Identity";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import {NextTicketUpdateCollectionPeriod} from "./view/NextTicketUpdateCollectionPeriod";
import {pipe} from "fp-ts/lib/pipeable";

export enum TicketUpdateCollectionStatus {
    RUNNING,
    COMPLETED,
    FAILED
}

type TicketUpdateCollectionPeriod = {
    from: Date,
    to: Date
}

export default class TicketUpdateCollection extends AggregateRoot {
    private _status: TicketUpdateCollectionStatus;
    private _to: Date;
    private _startedAt: Date;
    private endedAt: Date;
    private numberOfTickets: number;

    constructor(id: string,
                active: boolean,
                private readonly _devProjectId: string,
                status: TicketUpdateCollectionStatus,
                private readonly _from: Date) {
        super(id, active);
        this._status = status;
        this._to = new Date(_from.getDay()+1);
        this._startedAt = new Date();
    }

    static create(nextPeriod: NextTicketUpdateCollectionPeriod):
        E.Either<Error, TicketUpdateCollection> {
        return pipe (
            O.fromNullable(nextPeriod.ticketBoardKey),
            E.fromOption(new Error("Development Project is not linked to a ticket board")),
            E.chain(_ => E.right(nextPeriod.lastTicketUpdateCollectionPeriodEnd ?
                    nextPeriod.lastTicketUpdateCollectionPeriodEnd :
                    nextPeriod.devProjectStartedOn)),
            E.map(from => new TicketUpdateCollection(
                Identity.generate(),
                true,
                nextPeriod.devProjectId,
                TicketUpdateCollectionStatus.RUNNING,
                from))
        )
    }

    get devProjectId(): string {
        return this._devProjectId
    }

    get from(){
        return this._from
    }

    get to(): Date {
        return  this._to
    }
}
