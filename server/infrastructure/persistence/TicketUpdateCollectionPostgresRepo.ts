import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as O from 'fp-ts/lib/Option'
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import TicketUpdate from "../../domain/product/TicketUpdate";
import {QueryResultRow} from "pg";
import PostgresRepository from "./PostgresRepository";
import {
    ticketUpdateCollectionFields,
    translateToOptionalDevProject,
    translateToTicketUpdateCollection
} from "./QueryResultTranslator";
import {array} from "fp-ts/lib/Array";

export default class TicketUpdateCollectionPostgresRepo extends PostgresRepository<TicketUpdateCollection>
implements TicketUpdateCollectionRepository {

    private readonly byId = 'SELECT '+ ticketUpdateCollectionFields +
        ' FROM ticket_update_collection AS c LEFT JOIN ticket_update as u ON u.ticket_update_collection_id = c.id  WHERE c.id=$1';
    private readonly insert =
        'INSERT INTO ticket_update_collection(id, active, status, dev_project_id, from_day, to_day, started_at) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id';
    private readonly insertTicketUpdate =
        'INSERT INTO ticket_update(id, external_ref, key, change_log_read, changed, ticket_update_collection_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING id';

    private readonly byStatus = 'SELECT * FROM ticket_update_collection WHERE status=$1';

    constructor(client: PostgresClient) {
        super(client)
    }

    findById(id: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return pipe(
            this.client.query(this.byId, [id]),
            TE.map(translateToTicketUpdateCollection),
            TE.chain(TE.fromEither)
        )
    }

    findByProject(devProjectId: string, limit: number): TE.TaskEither<Error, TicketUpdateCollection[]> {
        throw new Error("Method not implemented.");
    }

    findLatestByProject(devProjectId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        throw new Error("Method not implemented.");
    }

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        throw new Error("Method not implemented.");
    }

    save(collection: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        return pipe(
            this.client.query(this.begin),
            TE.chain(() => this.client.query(this.insert, [collection.id, collection.isActive,
                TicketUpdateCollectionStatus[collection.status], collection.devProjectId, collection.period.from,
                collection.period.to, collection.startedAt])),
            TE.chain( result => this.saveTicketUpdates(collection.ticketUpdates, collection.id, result)),
            TE.chain(result => this.commitSavedEntity(collection.id, result)),
            TE.chain(() => this.findById(collection.id)),
            TE.chain(option => option.isSome() ?
                TE.right(T.task.of(option.value)) :
                TE.left(T.task.of(new Error("Development project not not saved."))))
        )
    }

    update(id: string, item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        throw new Error("Method not implemented.");
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }

    private saveTicketUpdates(ticketUpdates: TicketUpdate[], collectionId: string, result: QueryResultRow):
        TE.TaskEither<Error, QueryResultRow> {
        return ticketUpdates.length === 0 ?
            TE.taskEither.of(result) :
            array.reduce(ticketUpdates, TE.taskEither.of(result), (previous, current) => {
                return pipe(
                    previous,
                    TE.chain(result => this.saveTicketUpdate(current, collectionId, result))
                )
            });
    }

    private saveTicketUpdate(ticketUpdate: TicketUpdate, collectionId: string, result: QueryResultRow):
        TE.TaskEither<Error, QueryResultRow> {
        return this.client.query(this.insertTicketUpdate, [ticketUpdate.id, ticketUpdate.externalRef,
            ticketUpdate.ticketKey, ticketUpdate.isChangeLogRead, ticketUpdate.isChanged, collectionId])
    }
}
