import AggregateRoot from "../AggregateRoot";
import Identity from "../Identity";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import {NextTicketUpdateCollectionPeriod} from "./view/NextTicketUpdateCollectionPeriod";
import {pipe} from "fp-ts/lib/pipeable";
import {UpdatedTicket} from "./service/TicketBoardIntegration";
import TicketUpdate from "./TicketUpdate";

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
    private _ticketUpdates: Map<string, TicketUpdate>;
    private _failedAt: string;
    private _failReason: string;

    constructor(id: string,
                active: boolean,
                private readonly _devProjectId: string,
                status: TicketUpdateCollectionStatus,
                from: Date) {
        super(id, active);
        this._status = status;
        this._period = new TicketUpdateCollectionPeriod(from, new Date(from.getDay()+1));
        this._startedAt = new Date();
        this._ticketUpdates = new Map<string, TicketUpdate>()
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

    get status(){
        return this._status
    }

    get startedAt() {
        return this._startedAt
    }

    get ticketUpdates(): TicketUpdate[] {
        let updates: TicketUpdate[] = [];
        for (let update of this._ticketUpdates.values()){
            updates.push(update)
        }
        return updates;
    }

    willRunForTickets(updatedTickets: UpdatedTicket[]): E.Either<Error, void> {
        return E.tryCatch( () => {
            updatedTickets.map(ticket => {
                this._ticketUpdates.set(ticket.key,
                    new TicketUpdate(Identity.generate(), ticket.id, ticket.key))
            })},
        err => err as Error
        )
    }

    completedForTicket(ticketExternalRef: number, ticketKey: string, changed:boolean):E.Either<Error, void> {
        return E.tryCatch( () => {
                this._ticketUpdates.get(ticketKey).changed(changed);
                return this.complete()
            },
            err => err as Error
        )
    }

    failed(atProcessor: string, forReason: string):E.Either<Error, void> {
        return E.tryCatch( () => {
                this._status = TicketUpdateCollectionStatus.FAILED;
                this._failedAt = atProcessor;
                this._failReason = forReason;
                this._endedAt = new Date();
            },
            err => err as Error
        )
    }

    private complete(): void {
        let allRead = true;
        for (let update of this._ticketUpdates.values()){
            allRead = allRead && update.isChangeLogRead;
        }
        if (allRead) {
            this._status = TicketUpdateCollectionStatus.COMPLETED;
            this._endedAt = new Date();
        }
    }


}
