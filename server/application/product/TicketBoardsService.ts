import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import AddTicketBoard from "./commands/AddTicketBoard";
import ApplicationService from "../ApplicationService";
import LogFactory from "../../domain/LogFactory";
import EventBus from "../../domain/EventBus";
import TicketBoard from "../../domain/product/TicketBoard";
import TicketBoardIntegration from "../../domain/product/TicketBoardIntegration";
import {TicketBoardRepository} from "../../domain/product/TicketBoardRepository";

export default class TicketBoardsService extends ApplicationService<TicketBoard> {
  private readonly log = LogFactory.get(TicketBoardsService.name);

  constructor (eventBus: EventBus,
               private readonly repository: TicketBoardRepository,
               private readonly integration: TicketBoardIntegration){
    super(eventBus);
  }

  byId(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  addTicketBoard(command: AddTicketBoard): TE.TaskEither<Error,string> {
      return pipe(
          TicketBoard.create(command.key, this.repository, this.integration),
          TE.chainFirst((a) => TE.fromIO(this.log.io.info(`Ticket board ${a.id} created.`))),
          TE.chainFirst(this.publishEvents),
          TE.chainFirst(this.repository.save),
          TE.map((ticketBoard => ticketBoard.id))
      )
  }
}
