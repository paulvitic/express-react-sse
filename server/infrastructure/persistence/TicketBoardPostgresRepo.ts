import TicketBoard from "../../domain/product/TicketBoard";
import {TicketBoardRepository} from "../../domain/product/TicketBoardRepository";
import LogFactory from "../context/LogFactory";
import PostgresClient from "../clients/PostgresClient";
import {QueryConfig} from "pg";
import {translateToTicketBoard} from "./QueryResultTranslator";
import {fromNullable, none, Option, some} from "fp-ts/lib/Option";
import {Either, left, right, tryCatch} from "fp-ts/lib/Either";

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

    delete(id: string): Promise<Either<TicketBoardDeleteError, boolean>> {
        const query = {
            text: 'DELETE FROM jira.ticket_board WHERE id=$1',
            values: [id],
        };
        return new Promise<Either<TicketBoardDeleteError, boolean>>(resolve => {
            this.client.execute(query)
                .then(result => {
                    resolve(right(result.rowCount === 1))
                })
                .catch(err => {
                   resolve(left(new TicketBoardDeleteError(err)))
                })
        })
    }

    find(item: TicketBoard): Promise<TicketBoard[]> {
        return undefined;
    }

    findOne(id: string): Promise<TicketBoard> {
        return undefined;
    }

    findOneByExternalKey(key: string): Promise<Option<TicketBoard>> {
        const query = {
            text: 'SELECT * FROM jira.ticket_board WHERE external_key=$1',
            values: [key],
        };
        return this.queryTicketBoard(query);
    }

    save = async (item: TicketBoard): Promise<Either<TicketBoardSaveError, TicketBoard>> => {
        const query = {
            text: 'INSERT INTO jira.ticket_board(id, external_id, external_key) VALUES($1, $2, $3) RETURNING id',
            values: [item.id, item.externalId, item.externalKey],
        };
        return new Promise<Either<TicketBoardSaveError, TicketBoard>>(resolve => {
            this.client.execute(query)
                .then(result => {
                    resolve(translateToTicketBoard(result))
                })
                .catch(err => {
                    resolve(left(new TicketBoardSaveError(err)))
                })
        })
    };

    update(id: string, item: TicketBoard): Promise<TicketBoard> {
        return undefined;
    }

    private queryTicketBoard = async (query: QueryConfig): Promise<Option<TicketBoard>> => {
        let result = await this.client.execute(query);
        return new Promise<Option<TicketBoard>>(resolve => {
            resolve(fromNullable(translateToTicketBoard(result).getOrElse(null)));
        })
    };
}
