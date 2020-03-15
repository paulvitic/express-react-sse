import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import PostgresRepository from "./PostgresRepository";
import * as translate from "./TicketUpdateCollectionPostgresTranslator";
import LogFactory from "../../domain/LogFactory";
import {array} from "fp-ts/lib/Array";
import * as M from "fp-ts/lib/Monoid";
import DomainEvent from "../../domain/DomainEvent";
import TicketUpdate from "../../domain/product/TicketUpdate";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import {QueryResultRow} from "pg";

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
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`executing find latest by project query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindOptionalCollectionResult(result))
            )
        )
    }

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        return pipe(
            TE.fromEither(translate.toFindByStatusQuery(status)),
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`executing find by status query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindCollectionsResult(result)))
        )
    }

    save = (collection: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> => {
        return  pipe(
            TE.fromEither(translate.toInsertCollectionQuery(collection)),
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`executing insert query: ${query}`))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.rollBack(err),
                result => this.commit(result))),
            TE.chain(() => TE.taskEither.of(collection))
        )
    };

    update(id: string, collection: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        return  pipe(
            TE.fromEither(translate.toUpdateCollectionQuery(collection)),
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`executing update query: ${query}`))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.rollBack(err),
                result => this.commit(result))),
            TE.chain(() => TE.taskEither.of(collection))
        )
    }

    updatec(id: string, update: (collection: TicketUpdateCollection) => E.Either<Error, void>):
        TE.TaskEither<Error, void> {
        return pipe(
            TE.fromEither(translate.toSelectForUpdateQuery(id)),
            TE.chain(this.client.query),
            TE.chain(result =>
                TE.fromEither(translate.fromFindOptionalCollectionResult(result[1]))),
            TE.chain(optionalColl => optionalColl.isNone() ?
                TE.left2v(new Error('collection does not exists')) :
                TE.right2v(optionalColl.value)),
            TE.chainFirst(collection => TE.fromEither(update(collection))),
            TE.chain(collection =>
                TE.fromEither(translate.toUpdateCollectionQuery(collection))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.rollBack(err),
                result => this.commit(result))),
            TE.chain(() => TE.taskEither.of(null))
        )
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }


    private updateForEvent(id: string, event:DomainEvent) {

    }
}
