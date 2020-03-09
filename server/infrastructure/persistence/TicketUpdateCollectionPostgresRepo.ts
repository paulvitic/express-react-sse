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
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`executing find by id query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindOptionalCollectionResult(result)))
        )
    }

    findByProject(prodDevId: string, limit: number): TE.TaskEither<Error, TicketUpdateCollection[]> {
        throw new Error("Method not implemented.");
    }

    findLatestByProject(prodDevId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return pipe(
            TE.fromEither(translate.toFindLatestByProjectQuery(prodDevId)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`executing find latest by project query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindOptionalCollectionResult(result)))
        )
    }

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        return pipe(
            TE.fromEither(translate.toFindByStatusQuery(status)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`executing find by status query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindCollectionsResult(result)))
        )
    }

    save(collection: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        return  pipe(
            TE.fromEither(translate.toInsertCollectionQuery(collection)),
            TE.chainFirst(query => TE.rightIO(this.log.io.info(`executing insert query: ${query}`))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.rollBack(err),
                result => this.commit(result))),
            TE.chain(() => TE.taskEither.of(collection))
        )
    }

    update(id: string, item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        throw new Error("Method not implemented.");
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }
}
