import {Repository} from "../../Repository";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../TicketUpdateCollection";

export default abstract class TicketUpdateCollectionRepository extends Repository<TicketUpdateCollection> {
    abstract findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]>
    abstract findLatestByProject(devProjectId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>>
    abstract findByProject(devProjectId: string, limit:number): TE.TaskEither<Error, TicketUpdateCollection[]>
}

