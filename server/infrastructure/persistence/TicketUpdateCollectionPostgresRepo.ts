import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresRepository from "./PostgresRepository";
import {
    ticketUpdateCollectionFields,
    translateToTicketUpdateCollection
} from "./QueryResultTranslator";
import * as translate from "./TicketUpdateCollectionPostgresTranslator";
import LogFactory from "../../domain/LogFactory";

export default class TicketUpdateCollectionPostgresRepo extends PostgresRepository<TicketUpdateCollection>
implements TicketUpdateCollectionRepository {
    private readonly log = LogFactory.get(TicketUpdateCollectionPostgresRepo.name);

    private readonly byId = 'SELECT '+ ticketUpdateCollectionFields +
        ' FROM ticket_update_collection AS c LEFT JOIN ticket_update as u ON u.ticket_update_collection_id = c.id  WHERE c.id=$1';
    private readonly byStatus = 'SELECT * FROM ticket_update_collection WHERE status=$1';

    constructor(client: PostgresClient) {
        super(client)
    }

    findById(id: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return pipe(
            this.client.query(this.byId, [id]),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`Query:\n ${query}`))),
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
        return  pipe(
            TE.fromEither(translate.toInsertCollectionQuery(collection)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`Executing insert query: ${query}`))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.rollBack(err),
                result => this.commit(result))),
            TE.chain( result => TE.fromEither(translate.fromCollectionInsertResult(result))),
            TE.chainFirst(inserted => TE.rightIO(
                this.log.io.info(`Inserted:\n ${JSON.stringify(inserted,
                    (key, value)=> value instanceof Map ? [...value] : value, // not exactly the string output we need
                    2)}`)))
        )
    }

    update(id: string, item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        throw new Error("Method not implemented.");
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }
}
