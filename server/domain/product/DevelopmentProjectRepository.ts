import {Repository} from "../Repository";
import TicketBoard from "./TicketBoard";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import DevelopmentProject from "./DevelopmentProject";

export default interface DevelopmentProjectRepository extends Repository<DevelopmentProject> {
    findOneByTicketBoardKey(key: string): TE.TaskEither<Error, O.Option<DevelopmentProject>>
}
