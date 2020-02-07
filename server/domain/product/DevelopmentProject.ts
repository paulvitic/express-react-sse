import AggregateRoot from "../AggregateRoot";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import TicketBoard from "./TicketBoard";
import DevelopmentProjectRepository from "./DevelopmentProjectRepository";
import {pipe} from "fp-ts/lib/pipeable";
import TicketBoardIntegration, {TicketBoardInfo} from "./TicketBoardIntegration";
import Identity from "../Identity";

export class DevelopmentProjectError extends Error {}

export default class DevelopmentProject extends AggregateRoot {

    private ticketBoard: TicketBoard;

    constructor(id: string,
                private name: string,
                exists?: boolean,) {
        super(id, exists);
        if (!name) throw new DevelopmentProjectError("Can not create a project without a project name")
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

    private static createFromProjectInfo(info: TicketBoardInfo):
        E.Either<DevelopmentProjectError,DevelopmentProject> {
        return E.tryCatch(() => {
            return new DevelopmentProject(Identity.generate(), info.name)
        }, reason => new DevelopmentProjectError(String(reason)))
    };

    addTicketBoard(key:string, externalRef: string): E.Either<DevelopmentProjectError,boolean> {
        if (this.ticketBoard) return E.left(new DevelopmentProjectError('Ticket board already exists'));
        // add ticket board
        // create domain event
        return (E.right(true))
    }

    removeTicketBoard(key:string): E.Either<DevelopmentProjectError,boolean>{
        if (!this.ticketBoard) return E.left(new DevelopmentProjectError('No ticket board to remove'));
        if (this.ticketBoard.externalKey!==key) return E.left(new DevelopmentProjectError(`No ticket board with key ${key} to remove`));
        // remove ticket board
        // create domain event
        return (E.right(true))
    }

    updateTicketBoardKey(key:string): E.Either<DevelopmentProjectError,boolean>{
        if (!this.ticketBoard) return E.left(new DevelopmentProjectError('No ticket board to update'));
        if (this.ticketBoard.externalKey===key) return E.left(new DevelopmentProjectError(`Ticket board with key is already ${key}`));
        // update ticket board key
        // create domain event
        return (E.right(true))
    }

}
