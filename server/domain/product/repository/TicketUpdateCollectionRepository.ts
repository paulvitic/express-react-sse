import {Repository} from "../../Repository";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../TicketUpdateCollection";

export default interface TicketUpdateCollectionRepository extends Repository<TicketUpdateCollection> {
    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]>
    findLatestByProject(devProjectId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>>
    findByProject(devProjectId: string, limit:number): TE.TaskEither<Error, TicketUpdateCollection[]>
}

