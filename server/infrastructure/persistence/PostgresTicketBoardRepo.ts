import TicketBoard from "../../domain/product/TicketBoard";
import {TicketBoardRepository} from "../../domain/product/TicketBoardRepository";
import LogFactory from "../context/LogFactory";
import PostgresClient from "../clients/PostgresClient";

export default class PostgresTicketBoardRepo implements TicketBoardRepository {
    private readonly log = LogFactory.get(PostgresTicketBoardRepo.name);

    constructor(private readonly client: PostgresClient) {}

    delete(id: string): Promise<boolean> {
        return undefined;
    }

    find(item: TicketBoard): Promise<TicketBoard[]> {
        return undefined;
    }

    findOne(id: string): Promise<TicketBoard> {
        return undefined;
    }

    findOneByExternalKey(key: string): Promise<TicketBoard> {
        return new Promise<TicketBoard>(resolve => {

        })
    }

    save(item: TicketBoard): Promise<TicketBoard> {
        const query = {
            text: 'INSERT INTO jira.ticket_board(id, external_id, external_key) VALUES($1, $2, $3) RETURNING id',
            values: [item.id, item.externalId, item.externalKey],
        };

        return new Promise<TicketBoard>((resolve, reject) => {
            this.client.insert(query)
                .then((count) => {
                    if (count === 1) {
                        this.log.info(`Saved ticket board ${item.id}`);
                        resolve(item);
                    } else {
                        reject(`Unexpected insert count ${count} while saving ticket board ${item.id}`);
                    }
                }).catch((err)=> {
                    reject(`Error while saving ticket board ${item.id}: ${err}`);
            })
        })
    }

    update(id: string, item: TicketBoard): Promise<TicketBoard> {
        return undefined;
    }
}
