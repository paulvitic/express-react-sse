import {Repository} from "../../Repository";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../TicketUpdateCollection";
import * as E from "fp-ts/lib/Either";
import {QueryResultRow} from "pg";

export interface TicketUpdateCollectionRepository extends Repository<TicketUpdateCollection> {
    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]>
    findLatestByProject(prodDevId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>>
    findByProject(prodDevId: string, limit:number): TE.TaskEither<Error, TicketUpdateCollection[]>
}

