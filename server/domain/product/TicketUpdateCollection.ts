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

export class TicketUpdateCollectionPeriod {
    constructor(readonly from: Date, readonly to:Date){}
    isDuring(timeStamp: Date): boolean {
        return timeStamp > this.from && timeStamp < this.to
    }
}

export default class TicketUpdateCollection extends AggregateRoot {
    private _status: TicketUpdateCollectionStatus;
    private readonly _period: TicketUpdateCollectionPeriod;
    private readonly _startedAt: Date;
    private _endedAt: Date;
    private numberOfTickets: number;

    constructor(id: string,
                active: boolean,
                private readonly _devProjectId: string,
                status: TicketUpdateCollectionStatus,
                from: Date) {
        super(id, active);
        this._status = status;
        this._period = new TicketUpdateCollectionPeriod(from, new Date(from.getDay()+1));
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

    get period(){
        return this._period
    }
}
