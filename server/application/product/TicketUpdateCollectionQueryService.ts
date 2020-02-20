import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import {NextTicketUpdateCollectionPeriod} from "../../domain/product/view/NextTicketUpdateCollectionPeriod";

export interface TicketUpdateCollectionQueryService {
    nextUpdateCollectionPeriod(devProjectId: string):
        TE.TaskEither<Error, O.Option<NextTicketUpdateCollectionPeriod>>
}
