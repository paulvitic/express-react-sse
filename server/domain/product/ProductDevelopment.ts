import AggregateRoot from "../AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./TicketBoard";
import {pipe} from "fp-ts/lib/pipeable";
import TicketBoardIntegration from "./service/TicketBoardIntegration";
import Identity from "../Identity";
import {ProductDevelopmentCreated, TicketBoardLinked} from "./event";
import LogFactory from "../LogFactory";

export class ProductDevelopmentError extends Error {}

export default class ProductDevelopment extends AggregateRoot {
    private readonly log = LogFactory.get(ProductDevelopment.name);
    private readonly _name: string;
    private readonly _startedOn: Date;
    private _ticketBoard: TicketBoard | null;

    constructor(id: string,
                active: boolean,
                name: string,
                startedOn: Date,
                ticketBoard?: TicketBoard) {
        super(id, active);
        if (!name) throw new ProductDevelopmentError("Can not create a project without a project name");
        this._name = name;
        this._startedOn = startedOn;
        this._ticketBoard = ticketBoard ? ticketBoard : null;
    }

    get name(){
        return this._name;
    }

    get startedOn() {
        return this._startedOn
    }

    get ticketBoard(){
        return this._ticketBoard
    }

    hasLinkedTicketBoard(): boolean {
        return this._ticketBoard !== null;
    }

    static createFromTicketBoard(key:string, defaultStart: Date, integration: TicketBoardIntegration):
        TE.TaskEither<ProductDevelopmentError, ProductDevelopment> {
        return pipe(
            integration.assertProject(key),
            TE.filterOrElse(
                info => info.projectCategory.name===TicketBoard.PRODUCT_DEV_PROJECT_CATEGORY,
                () => new ProductDevelopmentError("Ticket board is not for a development project")
            ),
            TE.chain(info => TE.fromEither(
                pipe(
                    E.tryCatch(() => new ProductDevelopment(
                        Identity.generate(),
                        true, info.name,
                        defaultStart ? defaultStart : info.created),
                        e => new ProductDevelopmentError("")),
                    E.chainFirst( productDev => productDev.recordEvent(new ProductDevelopmentCreated(
                        ProductDevelopment.name,
                        productDev.id,
                        productDev.name,
                        productDev.startedOn.toISOString()))),
                    E.chainFirst(productDev => productDev.linkTicketBoard(key, info.id))
                )
            ))
        )
    }

    linkTicketBoard(key:string, externalRef: number): E.Either<ProductDevelopmentError, number> {
        return pipe(
            E.either.of(new TicketBoard(Identity.generate(), key, externalRef, this.id)),
            E.filterOrElse(() => this.ticketBoard===null,
                () => new ProductDevelopmentError('Ticket board already exists')),
            E.map(ticketBoard => new TicketBoardLinked(
                ProductDevelopment.name,
                this.id,
                ticketBoard.id,
                ticketBoard.key,
                ticketBoard.ref,
                this.startedOn.toISOString())),
            E.map(this.onTicketBoardLinked),
            E.chain(this.recordEvent)
        )
    }

    removeTicketBoard(key:string): E.Either<ProductDevelopmentError,boolean>{
        if (!this.ticketBoard) return E.left(new ProductDevelopmentError('No ticket board to remove'));
        if (this.ticketBoard.key!==key) return E.left(new ProductDevelopmentError(`No ticket board with key ${key} to remove`));
        // remove ticket board
        // create domain event
        return (E.right(true))
    }

    updateTicketBoardKey(key:string): E.Either<ProductDevelopmentError,boolean>{
        if (!this.ticketBoard) return E.left(new ProductDevelopmentError('No ticket board to update'));
        if (this.ticketBoard.key===key) return E.left(new ProductDevelopmentError(`Ticket board with key is already ${key}`));
        // update ticket board key
        // create domain event
        return (E.right(true))
    }

    private onTicketBoardLinked = (event: TicketBoardLinked): TicketBoardLinked => {
        this._ticketBoard = new TicketBoard(event.ticketBoardId, event.ticketBoardKey, event.ticketBoardRef, this.id);
        return event
    }
}
