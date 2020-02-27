import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import * as O from 'fp-ts/lib/Option'
import TicketUpdateCollectionRepository from "../../domain/product/repository/TicketUpdateCollectionRepository";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../domain/product/TicketUpdateCollection";
import {developmentProjectFields} from "./QueryResultTranslator";

export default class TicketUpdateCollectionPostgresRepo extends TicketUpdateCollectionRepository {
    private readonly byStatus = 'SELECT * FROM ticket_update_collection WHERE status=$1';

    delete(id: string): TE.TaskEither<Error, boolean> {
        return undefined;
    }

    findById(id: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return undefined;
    }

    findByProject(devProjectId: string, limit: number): TE.TaskEither<Error, TicketUpdateCollection[]> {
        return undefined;
    }

    findLatestByProject(devProjectId: string): TE.TaskEither<Error, O.Option<TicketUpdateCollection>> {
        return undefined;
    }

    findByStatus(status: TicketUpdateCollectionStatus): TE.TaskEither<Error, TicketUpdateCollection[]> {
        return undefined;
    }

    save(item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        return undefined;
    }

    update(id: string, item: TicketUpdateCollection): TE.TaskEither<Error, TicketUpdateCollection> {
        return undefined;
    }

}
