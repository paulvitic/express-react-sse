import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import {TicketUpdateCollectionRepository} from "../../domain/product/repository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import * as translate from "./TicketUpdateCollectionPostgresTranslator";

export default class TicketUpdateCollectionPostgresRepo implements TicketUpdateCollectionRepository {
    constructor(private readonly client: PostgresClient) {}

    findById(id: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return pipe(
            TE.fromEither(translate.toFindByIdQuery(id)),
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
            TE.chain(query => this.client.query(query)),
            TE.chain( result => result.rows.length === 0 ?
                TE.right2v(O.none) :
                this.findById(result.rows[0].collection_id)
            )
        )
    }

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        return pipe(
            TE.fromEither(translate.toFindByStatusQuery(status)),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindCollectionsResult(result)))
        )
    }

    save = (collection: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> => {
        return  pipe(
            TE.fromEither(translate.toInsertCollectionQuery(collection)),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.client.rollBack(err),
                result => this.client.commit(result))),
            TE.chain(() => TE.taskEither.of(collection))
        )
    };

    update(id: string, collection: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        return  pipe(
            TE.fromEither(translate.toUpdateCollectionQuery(id, collection)),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.client.rollBack(err),
                result => this.client.commit(result))),
            TE.chain(() => TE.taskEither.of(collection))
        )
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }
}
