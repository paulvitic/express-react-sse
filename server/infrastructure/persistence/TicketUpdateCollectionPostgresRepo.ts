import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresRepository from "./PostgresRepository";
import * as translate from "./TicketUpdateCollectionPostgresTranslator";
import LogFactory from "../../domain/LogFactory";

export default class TicketUpdateCollectionPostgresRepo extends PostgresRepository<TicketUpdateCollection>
implements TicketUpdateCollectionRepository {
    private readonly log = LogFactory.get(TicketUpdateCollectionPostgresRepo.name);

    constructor(client: PostgresClient) {
        super(client)
    }

    findById(id: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return pipe(
            TE.fromEither(translate.toFindByIdQuery(id)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`Executing find query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindOptionalCollectionResult(result))),
            TE.chainFirst(found => TE.rightIO(
                this.log.io.info(`Found:\n ${JSON.stringify(found,
                (key, value)=> value instanceof Map ?  Object.fromEntries(value.entries()) : value,
                2)}`)))
        )
    }

    findByProject(devProjectId: string, limit: number): TE.TaskEither<Error, TicketUpdateCollection[]> {
        throw new Error("Method not implemented.");
    }

    findLatestByProject(devProjectId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        throw new Error("Method not implemented.");
    }

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        return pipe(
            TE.fromEither(translate.toFindByStatusQuery(status)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`Executing find query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindCollectionsResult(result)))
        )
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
                this.log.io.debug(`Inserted:\n ${JSON.stringify(inserted,
                    (key, value)=> value instanceof Map ?  Object.fromEntries(value.entries()) : value,
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
