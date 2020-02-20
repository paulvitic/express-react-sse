import {Repository} from "../../Repository";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import DevelopmentProject from "../DevelopmentProject";

export default abstract class DevelopmentProjectRepository extends Repository<DevelopmentProject> {
    abstract findOneByTicketBoardKey(key: string): TE.TaskEither<Error, O.Option<DevelopmentProject>>
}
