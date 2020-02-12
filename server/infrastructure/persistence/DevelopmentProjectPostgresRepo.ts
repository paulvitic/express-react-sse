import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as O from 'fp-ts/lib/Option'
import DevelopmentProject from "../../domain/product/DevelopmentProject";
import DevelopmentProjectRepository from "../../domain/product/DevelopmentProjectRepository";
import LogFactory from "../../domain/LogFactory";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import {developmentProjectFields, translateToOptionalDevProject} from "./QueryResultTranslator";
import {QueryResultRow} from "pg";
import TicketBoard from "../../domain/product/TicketBoard";

export default class DevelopmentProjectPostgresRepo implements DevelopmentProjectRepository {
    private readonly log = LogFactory.get(DevelopmentProjectPostgresRepo.name);
    private readonly begin = 'BEGIN';
    private readonly commit = 'COMMIT';
    private readonly rollback = 'ROLLBACK';
    private readonly insertBoard = 'INSERT INTO ticket_board(id, external_ref, key) VALUES($1, $2, $3)';
    private readonly insert = 'INSERT INTO development_project(id, active, name) VALUES($1, $2, $3) RETURNING id';
    private readonly insertWithBoard =
        'INSERT INTO development_project(id, active, name, ticket_board_id) VALUES($1, $2, $3, $4) RETURNING id';
    private readonly queryByTicketBoardKey = 'SELECT ' + developmentProjectFields() +
        ' FROM development_project AS dp LEFT JOIN ticket_board as tb ON dp.ticket_board_id = tb.id WHERE tb.key=$1';
    private readonly queryById = 'SELECT '+ developmentProjectFields() +
        ' FROM development_project AS dp LEFT JOIN ticket_board as tb ON dp.ticket_board_id = tb.id  WHERE dp.id=$1';

    constructor(private readonly client: PostgresClient) {}

    delete(id: string): TE.TaskEither<Error, boolean> {
        return undefined;
    }

    findById(id: string): TE.TaskEither<Error, O.Option<DevelopmentProject>> {
        return pipe(
            this.client.query(this.queryById, [id]),
            TE.map(translateToOptionalDevProject),
            TE.chain(TE.fromEither)
        )
    }

    findOneByTicketBoardKey(key: string): TE.TaskEither<Error, O.Option<DevelopmentProject>> {
        return pipe(
            this.client.query(this.queryByTicketBoardKey, [key]),
            TE.map(translateToOptionalDevProject),
            TE.chain(TE.fromEither)
        )
    }

    save(devProject: DevelopmentProject): TE.TaskEither<Error, DevelopmentProject> {
        return pipe(
            this.client.query(this.begin),
            TE.chain( result => this.saveTicketBoard(devProject.ticketBoard, result)),
            TE.chain(() => this.saveDevelopmentProject(devProject)),
            TE.chain(result => this.commitSavedEntity(devProject.id, result)),
            TE.chain(() => this.findById(devProject.id)),
            TE.chain(option => option.isSome() ?
                TE.right(T.task.of(option.value)) :
                TE.left(T.task.of(new Error("Development project not not saved."))))
        )
    }

    update(id: string, item: DevelopmentProject): TE.TaskEither<Error, DevelopmentProject> {
        return undefined;
    }

    private saveTicketBoard(ticketBoard: TicketBoard, result: QueryResultRow): TE.TaskEither<Error, QueryResultRow>{
        return ticketBoard === undefined || null ? TE.taskEither.of(result) :
            this.client.query(this.insertBoard, [ticketBoard.id, ticketBoard.externalRef, ticketBoard.key])
    }

    private saveDevelopmentProject(devProject: DevelopmentProject): TE.TaskEither<Error, QueryResultRow>{
        let {ticketBoard} = devProject;
        return ticketBoard === undefined || null ?
            this.client.query(this.insert, [devProject.id, devProject.isActive, devProject.name]) :
            this.client.query(this.insertWithBoard,[devProject.id, devProject.isActive, devProject.name, ticketBoard.id])
    }

    private commitSavedEntity(id: string, result: QueryResultRow): TE.TaskEither<Error, QueryResultRow>{
        return result.rowCount === 1 && result.rows[0].id === id ?
            this.client.query(this.commit) : this.client.query(this.rollback)
    }

}
