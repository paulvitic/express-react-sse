import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as O from 'fp-ts/lib/Option'
import ProductDevelopment from "../../domain/product/ProductDevelopment";
import ProductDevelopmentRepository from "../../domain/product/repository/ProductDevelopmentRepository";
import LogFactory from "../../domain/LogFactory";
import PostgresClient from "../clients/PostgresClient";
import {pipe} from "fp-ts/lib/pipeable";
import * as translate  from "./ProductDevPostgresTranslator";
import PostgresRepository from "./PostgresRepository";

export default class ProductDevPostgresRepo
    extends PostgresRepository<ProductDevelopment>
    implements ProductDevelopmentRepository {

    private readonly log = LogFactory.get(ProductDevPostgresRepo.name);

    constructor(client: PostgresClient) {
        super(client)
    }

    delete(id: string): TE.TaskEither<Error, boolean> {
        throw new Error("Method not implemented.");
    }

    findById = (id: string): TE.TaskEither<Error, O.Option<ProductDevelopment>> => {
        return pipe(
            TE.fromEither(translate.toFindByIdQuery(id)),
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`Executing find query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindOptionalProductDevResult(result))),
            TE.chainFirst(found => TE.rightIO(this.log.io.info(`Found:\n ${JSON.stringify(found,null,2)}`)))
        )
    };

    findOneByTicketBoardKey = (key: string): TE.TaskEither<Error, O.Option<ProductDevelopment>> => {
        return pipe(
            TE.fromEither(translate.toFindByTicketBoardKeyQuery(key)),
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`Executing find query: ${query}`))),
            TE.chain(query => this.client.query(query)),
            TE.chain( result => TE.fromEither(translate.fromFindOptionalProductDevResult(result))),
            TE.chainFirst(found => TE.rightIO(this.log.io.debug(`Found: ${JSON.stringify(found,null,2)}`)))
        )
    };

    save = (productDev: ProductDevelopment): TE.TaskEither<Error, ProductDevelopment> => {
        return pipe(
            TE.fromEither(translate.toInsertProductDevQuery(productDev)),
            TE.chainFirst(query => TE.rightIO(this.log.io.debug(`Executing insert query: ${query}`))),
            TE.chain(query => this.client.query(query).foldTaskEither(
                err => this.rollBack(err),
                result => this.commit(result))),
            TE.chain( () => TE.taskEither.of(productDev)),
        )
    };

    update = (id: string, item: ProductDevelopment)
        : TE.TaskEither<Error, ProductDevelopment> => {
        throw new Error("Method not implemented.");
    };
}
