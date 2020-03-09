import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";

import {TicketUpdateCollectionQueryService} from "./TicketUpdateCollectionQueryService";
import {TicketUpdateCollectionTracker} from "../../domain/product/process/ticketUpdateCollection/TicketUpdateCollectionTracker";
import {pipe} from "fp-ts/lib/pipeable";
import {CollectTicketUpdates} from "./commands";

export class TicketUpdateCollectionService {

    constructor(private readonly queryService: TicketUpdateCollectionQueryService,
                private readonly executive: TicketUpdateCollectionTracker) {}

    collectTicketUpdates(command: CollectTicketUpdates):TE.TaskEither<Error, boolean>{
        return pipe(
            this.queryService.nextUpdateCollectionPeriod(command.prodDevId),
            TE.chain(TE.fromOption(() => new Error(`Can not find development project ${command.prodDevId}`))),
            TE.chain(nextCollectionPeriod => this.executive.start(nextCollectionPeriod))
        )
    }
}
