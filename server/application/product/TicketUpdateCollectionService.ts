import * as TE from "fp-ts/lib/TaskEither";
import {TicketUpdateCollectionQueryService} from "./TicketUpdateCollectionQueryService";
import {TicketUpdateCollectionTracker} from "../../domain/product/process/ticketUpdateCollection/TicketUpdateCollectionTracker";
import {pipe} from "fp-ts/lib/pipeable";

export class TicketUpdateCollectionService {

    constructor(private readonly queryService: TicketUpdateCollectionQueryService,
                private readonly executive: TicketUpdateCollectionTracker) {}

    collectTicketUpdates(devProjectId: string):TE.TaskEither<Error, boolean>{
        return pipe(
            this.queryService.nextUpdateCollectionPeriod(devProjectId),
            TE.chain(TE.fromOption(() => new Error(`Can not find development project ${devProjectId}`))),
            TE.chain(nextCollectionPeriod => this.executive.start(nextCollectionPeriod))
        )
    }
}
