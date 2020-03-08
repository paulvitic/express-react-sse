import AggregateRoot from "../AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./TicketBoard";
import ProductDevelopmentRepository from "./repository/ProductDevelopmentRepository";
import {pipe} from "fp-ts/lib/pipeable";
import TicketBoardIntegration, {TicketBoardInfo} from "./service/TicketBoardIntegration";
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

    static createFromTicketBoard(key:string, repo:ProductDevelopmentRepository, integration: TicketBoardIntegration):
        TE.TaskEither<ProductDevelopmentError, ProductDevelopment> {
        return pipe(
            repo.findOneByTicketBoardKey(key),
            TE.filterOrElse(found => found.isNone(),
                () => new ProductDevelopmentError('Ticket board key already exists')),
            TE.chain(() => integration.assertProject(key)),
            TE.map(ProductDevelopment.createFromProjectInfo),
            TE.chain(TE.fromEither)
        )
    }

    linkTicketBoard(key:string, externalRef: number): E.Either<ProductDevelopmentError, number> {
        return pipe(
            E.either.of(new TicketBoard(Identity.generate(), key, externalRef, this.id)),
            E.filterOrElse(() => this.ticketBoard===null,
                () => new ProductDevelopmentError('Ticket board already exists')),
            E.map(ticketBoard => new TicketBoardLinked(ProductDevelopment.name,
                this.id,
                ticketBoard)),
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

    private static createFromProjectInfo(info: TicketBoardInfo):
        E.Either<ProductDevelopmentError,ProductDevelopment> {
        let created = pipe(
            E.tryCatch(() => new ProductDevelopment(Identity.generate(), true, info.name, info.created),
                    error => error as ProductDevelopmentError),
            E.filterOrElse(() => info.projectCategory.name===TicketBoard.PRODUCT_DEV_PROJECT_CATEGORY,
                () => new ProductDevelopmentError("Ticket board is not for a development project"))
        );

        return pipe(
            created.map(project => new ProductDevelopmentCreated(
                ProductDevelopment.name,
                project.id,
                info.name)),
            E.chain(event => created.chain(project => project.recordEvent(event))),
            E.chain(() => created.chain(project => project.linkTicketBoard(info.key, info.id))),
            E.chain(() => created)
        );
    };

    private onTicketBoardLinked = (event: TicketBoardLinked): TicketBoardLinked => {
        this._ticketBoard = event.ticketBoard;
        return event
    }
}
