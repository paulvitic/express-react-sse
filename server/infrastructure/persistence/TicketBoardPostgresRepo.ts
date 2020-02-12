import TicketBoard from "../../domain/product/TicketBoard";
import {TicketBoardRepository} from "../../domain/product/TicketBoardRepository";
import PostgresClient from "../clients/PostgresClient";
import {translateToOptionalTicketBoard, translateToTicketBoard, assertDelete } from "./QueryResultTranslator";
import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import {pipe} from "fp-ts/lib/pipeable";
import LogFactory from "../../domain/LogFactory";


class TicketBoardSaveError extends Error {
    constructor(message) {
        super(message);
    }
}

class TicketBoardDeleteError extends Error {
    constructor(message) {
        super(message);
    }
}

export default class TicketBoardPostgresRepo implements TicketBoardRepository {
    private readonly log = LogFactory.get(TicketBoardPostgresRepo.name);

    constructor(private readonly client: PostgresClient) {}

    delete(id: string): TE.TaskEither<TicketBoardDeleteError, boolean> {
        const query = {
            text: 'DELETE FROM jira.ticket_board WHERE id=$1',
            values: [id],
        };
        return pipe(
            this.client.executeQuery(query),
            TE.map(assertDelete),
            TE.chain(TE.fromEither)
        )
    }

    findById(id: string): TE.TaskEither<Error, O.Option<TicketBoard>> {
        return undefined;
    }

    findOneByExternalKey(key: string): TE.TaskEither<Error, O.Option<TicketBoard>> {
        const query = {
            text: 'SELECT * FROM jira.ticket_board WHERE external_key=$1',
            values: [key],
        };
        return pipe(
            this.client.executeQuery(query),
            TE.map(translateToOptionalTicketBoard),
            TE.chain(TE.fromEither)
        )
    }

    save = (item: TicketBoard): TE.TaskEither<TicketBoardSaveError, TicketBoard> => {
        const query = {
            text: 'INSERT INTO jira.ticket_board(id, external_id, external_key) VALUES($1, $2, $3) RETURNING *',
            values: [item.id, item.externalRef, item.key],
        };
        return pipe(
            this.client.executeQuery(query),
            TE.map(translateToTicketBoard),
            TE.chain(TE.fromEither)
        )
    };

    update(id: string, item: TicketBoard): TE.TaskEither<Error, TicketBoard> {
        return undefined;
    }
}
