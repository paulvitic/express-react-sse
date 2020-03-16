import EventListener from "../../EventListener";
import * as E from "fp-ts/lib/Either";
import EventBus from "../../EventBus";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import LogFactory from "../../LogFactory";
import {TicketChanged} from "../event";
import {TicketRepository} from "../repository";
import Ticket from "../Ticket";

export class TicketHandler implements EventListener<TicketChanged> {
    private readonly log = LogFactory.get(TicketHandler.name);

    constructor(private readonly repo: TicketRepository,
                private readonly eventBus: EventBus){}

    onEvent(event: TicketChanged): Promise<E.Either<Error, boolean>> {
        return pipe(
            this.repo.findOneByRef(event.ticketRef),
            TE.chain(ticket => ticket.isSome() ?
                TE.right2v(ticket.value) :
                this.create(event.ticketKey, event.ticketRef, event.prodDevId)),
            TE.chainFirst(ticket => TE.fromEither(ticket.recordHistory(event.changeLog))),
            TE.chainFirst(ticket => this.repo.update(ticket.id, ticket)),
            TE.chain(ticket => this.eventBus.publishEventsOf(ticket))
        ).run()
    }

    private handleTicketChanged = (event: TicketChanged): TE.TaskEither<Error, void> => {
        this.log.info(`Handling ${event.eventType}`);
        return TE.taskEither.of(null);
    };

    private create = (ticketKey: string, ticketRef: number, prodDevId: string):
        TE.TaskEither<Error, Ticket> => {
        return pipe(
            TE.fromEither(Ticket.create(ticketKey, ticketRef, prodDevId)),
            TE.chainFirst(this.eventBus.publishEventsOf),
            TE.chainFirst(this.repo.save)
        )
    }
}
