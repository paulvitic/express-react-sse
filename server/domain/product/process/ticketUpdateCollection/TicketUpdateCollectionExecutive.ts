import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import TicketUpdateCollection, {TicketUpdateCollectionStatus} from "../../TicketUpdateCollection";
import TicketUpdateCollectionRepository from "../../repository/TicketUpdateCollectionRepository";
import {pipe} from "fp-ts/lib/pipeable";
import EventBus from "../../../EventBus";
import {NextTicketUpdateCollectionPeriod} from "../../view/NextTicketUpdateCollectionPeriod";
import {TicketUpdateCollectionStarted} from "../../event/TicketUpdateCollectionStarted";

export class TicketUpdateCollectionExecutive {

    constructor(private readonly collectionRepo: TicketUpdateCollectionRepository,
                private readonly eventBus: EventBus) {
    }

    start(nextCollectionPeriod: NextTicketUpdateCollectionPeriod):TE.TaskEither<Error, boolean> {
        return pipe(
            this.collectionRepo.findByStatus(TicketUpdateCollectionStatus.RUNNING),
            TE.filterOrElse(running =>
                running.length===0, _ => new Error('A ticket update collection is already running.')),
            TE.chain(_ =>
                TE.fromEither(TicketUpdateCollection.create(nextCollectionPeriod))),
            TE.chain(collection =>
                this.collectionRepo.save(collection)),
            TE.chain( collection =>
                this.eventBus.publishEvent(new TicketUpdateCollectionStarted(
                    TicketUpdateCollection.name,
                    collection.id,
                    collection.nextEventSequence(),
                    collection.devProjectId,
                    collection.from,
                    collection.to
            )))
        )
    }

    // next processor:
    // call jira integration with +1 for toDate
    // if there are updates update collection aggregate and generate events for each

    // next processor:
    // for each updated ticket parse history and update tickets
    // after each is done check if collection completed
}
