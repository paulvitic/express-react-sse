import * as TE from "fp-ts/lib/TaskEither";
import {TicketUpdateCollectionQueryService} from "./TicketUpdateCollectionQueryService";
import {TicketUpdateCollectionTracker} from "../../domain/product/process/ticketUpdateCollection/TicketUpdateCollectionTracker";
import {pipe} from "fp-ts/lib/pipeable";

export class TicketUpdateCollectionService {

    constructor(private readonly queryService: TicketUpdateCollectionQueryService,
                private readonly executive: TicketUpdateCollectionTracker) {}

    collectTicketUpdates(prodDevId: string):TE.TaskEither<Error, boolean>{
        return pipe(
            this.queryService.nextUpdateCollectionPeriod(prodDevId),
            TE.chain(TE.fromOption(() => new Error(`Can not find development project ${prodDevId}`))),
            TE.chain(nextCollectionPeriod => this.executive.start(nextCollectionPeriod))
        )
    }
}
