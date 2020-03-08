import {Repository} from "../../Repository";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import ProductDevelopment from "../ProductDevelopment";

export default interface ProductDevelopmentRepository extends Repository<ProductDevelopment> {
    findOneByTicketBoardKey(key: string): TE.TaskEither<Error, O.Option<ProductDevelopment>>
}
