import LogFactory from "../../infrastructure/context/LogFactory";
import ApplicationService from "../ApplicationService";
import EventBus from "../../domain/EventBus";
import TicketBoard from "../../domain/product/TicketBoard";
import AddTicketBoard from "./commands/AddTicketBoard";
import TicketBoardIntegration from "../../domain/product/TicketBoardIntegration";
import {TicketBoardRepository} from "../../domain/product/TicketBoardRepository";
import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";


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
          TE.chain(this.publishEvents),// better to use filter or just pass through
          //TE.fold(error => T.of(error), ticketBoard => ticketBoard), // https://github.com/anotherhale/fp-ts_async-example/blob/master/src/async-example.ts
          TE.chain(this.repository.save),
          TE.map((ticketBoard => ticketBoard.id))
      )
  }
}
