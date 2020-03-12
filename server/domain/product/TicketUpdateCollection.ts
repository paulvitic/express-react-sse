import AggregateRoot from "../AggregateRoot";
import Identity from "../Identity";
import * as E from "fp-ts/lib/Either";
import {pipe} from "fp-ts/lib/pipeable";
import {UpdatedTicket} from "./service/TicketBoardIntegration";
import TicketUpdate from "./TicketUpdate";
import {TicketUpdateCollectionCompleted, TicketUpdateCollectionCreated, TicketUpdateCollectionStarted} from "./event";
import LogFactory from "../LogFactory";


class TicketUpdateCollectionError extends Error {
    constructor(message) {
        super(message);
        this.name = TicketUpdateCollection.name;
    }
}

export enum TicketUpdateCollectionStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED,
}

export class TicketUpdateCollectionPeriod {
    constructor(readonly from: Date,
                readonly to: Date){
    }
}


export default class TicketUpdateCollection extends AggregateRoot {
    private readonly log = LogFactory.get(TicketUpdateCollection.name);
    private readonly _period: TicketUpdateCollectionPeriod;
    private readonly _ticketUpdates: Map<string, TicketUpdate>;

    constructor(id: string,
                active: boolean,
                private _status: TicketUpdateCollectionStatus,
                private readonly _productDevId: string,
                private readonly _ticketBoardKey,
                from: Date,
                to?: Date,
                private _startedAt?: Date,
                private _endedAt? : Date,
                ticketUpdates?: TicketUpdate[]) {
        super(id, active);
        this._period = this._period =
            new TicketUpdateCollectionPeriod(from,
            to ? to : new Date(from.getTime() + (1000 * 60 * 60 * 24))
        );
        this._ticketUpdates = ticketUpdates ?
            ticketUpdates.reduce(
                (previous: Map<string, TicketUpdate>, current: TicketUpdate) => previous.set(current.key, current),
                new Map<string, TicketUpdate>()) :
            new Map<string, TicketUpdate>()
    }

    static create(productDevId: string, ticketBoardKey:string, from: Date)
        : E.Either<Error, TicketUpdateCollection> {
        return pipe(
            E.tryCatch2v(
                () => new TicketUpdateCollection(
                    Identity.generate(),
                    true,
                    TicketUpdateCollectionStatus.PENDING,
                    productDevId,
                    ticketBoardKey,
                    from),
                err => new TicketUpdateCollectionError(`error while creating pending ticket update collection: ${(err as Error).message}`)),
            E.chainFirst(collection => collection.recordEvent(
                new TicketUpdateCollectionCreated(
                    TicketUpdateCollection.name,
                    collection.id,
                    collection.status,
                    collection.productDevId,
                    collection.ticketBoardKey,
                    collection.period.from.toISOString(),
                    collection.period.to.toISOString())))
        )
    }

    get productDevId(): string {
        return this._productDevId
    }

    get period(){
        return this._period
    }

    get status(){
        return this._status
    }

    get ticketBoardKey(){
        return this._ticketBoardKey
    }

    get startedAt() {
        return this._startedAt
    }

    get endedAt() {
        return this._endedAt
    }

    get ticketUpdates(): TicketUpdate[] {
        let updates: TicketUpdate[] = [];
        if (this._ticketUpdates && this._ticketUpdates.size !== 0 ) {
            for (let update of this._ticketUpdates.values()){
                updates.push(update)
            }
        }
        return updates;
    }

    startCollection = (): E.Either<Error, void> => {
        this.log.debug("starting");
        if (this._status === TicketUpdateCollectionStatus.FAILED || this._status === TicketUpdateCollectionStatus.PENDING) {
            // FIXME also check period end date can not be larger then now
            this._startedAt = new Date();
            this._status = TicketUpdateCollectionStatus.RUNNING;
            this.recordEvent(new TicketUpdateCollectionStarted(
                TicketUpdateCollection.name,
                this.id,
                this.productDevId,
                this.ticketBoardKey,
                this.period.from.toISOString(),
                this.period.to.toISOString()));
            return E.right(null)
        } else {
            return E.left(new Error(`collection in status ${TicketUpdateCollectionStatus[this.status]} can not start`));
        }
    };

    willReadTickets(updatedTickets: UpdatedTicket[]): E.Either<Error, void> {
        return E.tryCatch2v( () => {
            updatedTickets.map(ticket => {
                this._ticketUpdates.set(ticket.key, new TicketUpdate(Identity.generate(), ticket.id, ticket.key))
            })},
        err => err as Error
        )
    }

    completedForTicket(ticketExternalRef: number, ticketKey: string)
        :E.Either<Error, void> {
        return E.tryCatch2v( () => {
                this._ticketUpdates.get(ticketKey).collect();
            },
            err => err as Error
        )
    }

    failed():E.Either<Error, void> {
        return E.tryCatch2v( () => {
                this._status = TicketUpdateCollectionStatus.FAILED;
                this._endedAt = new Date();
            },
            err => err as Error
        )
    }

    checkCompleted(): E.Either<Error, void> {
        return E.tryCatch2v( () => {
                let allCollected = true;
                for (let update of this._ticketUpdates.values()){
                    allCollected = allCollected && update.collected;
                }
                if (allCollected) {
                    this._status = TicketUpdateCollectionStatus.COMPLETED;
                    this._endedAt = new Date();
                    this.recordEvent(new TicketUpdateCollectionCompleted(
                        TicketUpdateCollection.name,
                        this.id,
                        this.productDevId,
                        this.ticketBoardKey,
                        this.endedAt.toISOString()));
                }
            },
            err => err as Error
        )
    }
}
