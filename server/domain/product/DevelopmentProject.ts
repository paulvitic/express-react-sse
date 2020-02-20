import AggregateRoot from "../AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./TicketBoard";
import DevelopmentProjectRepository from "./repository/DevelopmentProjectRepository";
import {pipe} from "fp-ts/lib/pipeable";
import TicketBoardIntegration, {TicketBoardInfo} from "./service/TicketBoardIntegration";
import Identity from "../Identity";
import {DevelopmentProjectCreated} from "./event/DevelopmentProjectCreated";
import {TicketBoardLinked} from "./event/TicketBoardLinked";
import LogFactory from "../LogFactory";

export class DevelopmentProjectError extends Error {}

export default class DevelopmentProject extends AggregateRoot {
    private readonly log = LogFactory.get(DevelopmentProject.name);
    private _name: string;
    private _startedOn: Date;
    private _ticketBoard: TicketBoard | null;

    constructor(id: string,
                active: boolean,
                name: string,
                startedOn: Date,
                ticketBoard?: TicketBoard) {
        super(id, active);
        if (!name) throw new DevelopmentProjectError("Can not create a project without a project name");
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

    static createFromTicketBoard(key:string, repo:DevelopmentProjectRepository, integration: TicketBoardIntegration):
        TE.TaskEither<DevelopmentProjectError, DevelopmentProject> {
        return pipe(
            repo.findOneByTicketBoardKey(key),
            TE.filterOrElse(found => found.isNone(),
                () => new DevelopmentProjectError('Ticket board key already exists')),
            TE.chain(() => integration.assertProject(key)),
            TE.map(DevelopmentProject.createFromProjectInfo),
            TE.chain(TE.fromEither)
        )
    }

    linkTicketBoard(key:string, externalRef: number): E.Either<DevelopmentProjectError, number> {
        return pipe(
            E.either.of(new TicketBoard(Identity.generate(), key, externalRef)),
            E.filterOrElse(() => this.ticketBoard===undefined,
                () => new DevelopmentProjectError('Ticket board already exists')),
            E.map(ticketBoard => new TicketBoardLinked(DevelopmentProject.name,
                this.id,
                this.nextEventSequence(),
                ticketBoard)),
            E.chain(this.onTicketBoardLinked),
            E.chain(this.recordEvent)
        )
    }

    removeTicketBoard(key:string): E.Either<DevelopmentProjectError,boolean>{
        if (!this.ticketBoard) return E.left(new DevelopmentProjectError('No ticket board to remove'));
        if (this.ticketBoard.key!==key) return E.left(new DevelopmentProjectError(`No ticket board with key ${key} to remove`));
        // remove ticket board
        // create domain event
        return (E.right(true))
    }

    updateTicketBoardKey(key:string): E.Either<DevelopmentProjectError,boolean>{
        if (!this.ticketBoard) return E.left(new DevelopmentProjectError('No ticket board to update'));
        if (this.ticketBoard.key===key) return E.left(new DevelopmentProjectError(`Ticket board with key is already ${key}`));
        // update ticket board key
        // create domain event
        return (E.right(true))
    }

    private static createFromProjectInfo(info: TicketBoardInfo):
        E.Either<DevelopmentProjectError,DevelopmentProject> {
        let created = pipe(
            E.tryCatch(() => new DevelopmentProject(Identity.generate(), true, info.name, info.created),
                    error => error as DevelopmentProjectError),
            E.filterOrElse(() => info.projectCategory.name===TicketBoard.DEV_PROJECT_CATEGORY,
                () => new DevelopmentProjectError("Ticket board is not for a development project"))
        );

        return pipe(
            created.map(project => new DevelopmentProjectCreated(
                DevelopmentProject.name,
                project.id,
                project.nextEventSequence(),
                info.name)),
            E.chain(event => created.chain(project => project.onTicketBoardCreated(event))),
            E.chain(event => created.chain(project => project.recordEvent(event))),
            E.chain(() => created.chain(project => project.linkTicketBoard(info.key, info.id))),
            E.chain(() => created)
        );
    };

    private onTicketBoardCreated = (event: DevelopmentProjectCreated):
        E.Either<DevelopmentProjectError, DevelopmentProjectCreated> => {
        return pipe(
            this.assertEventSequence(event.sequence),
            E.map(() => event)
        );
    };

    private onTicketBoardLinked = (event: TicketBoardLinked):
        E.Either<DevelopmentProjectError, TicketBoardLinked> => {
        return pipe(
            this.assertEventSequence(event.sequence),
            E.map(() => this._ticketBoard = event.ticketBoard),
            E.map(() => event)
        );
    };
}
