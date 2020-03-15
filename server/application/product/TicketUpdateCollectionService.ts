import * as TE from "fp-ts/lib/TaskEither";
import {TicketUpdateCollectionExecutive} from "../../domain/product/process/ticketUpdateCollection/TicketUpdateCollectionExecutive";
import {CollectTicketUpdates} from "./commands";
import {ProductDevelopmentRepository} from "../../domain/product/repository";
import {pipe} from "fp-ts/lib/pipeable";

class TicketUpdateCollectionServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = TicketUpdateCollectionService.name;
    }
}

export class TicketUpdateCollectionService {
    constructor(private readonly executive: TicketUpdateCollectionExecutive,
                private readonly prodDevRepo: ProductDevelopmentRepository) {}

    collectTicketUpdates(command: CollectTicketUpdates):TE.TaskEither<Error, boolean>{
        return pipe(
            this.prodDevRepo.findById(command.prodDevId),
            TE.chain(productDev => productDev.isSome() && productDev.value.ticketBoard ?
                TE.right2v(productDev.value) :
                TE.left2v(new TicketUpdateCollectionServiceError(`product development ${command.prodDevId} does not exists`))),
            TE.chain( prodDev => this.executive.start(prodDev.id, prodDev.ticketBoard.key, prodDev.startedOn))
        )
    }
}
