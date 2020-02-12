import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import CreateProjectFromTicketBoard from "./commands/CreateProjectFromTicketBoard";
import ApplicationService from "../ApplicationService";
import LogFactory from "../../domain/LogFactory";
import EventBus from "../../domain/EventBus";
import TicketBoard from "../../domain/product/TicketBoard";
import TicketBoardIntegration from "../../domain/product/TicketBoardIntegration";
import DevelopmentProject from "../../domain/product/DevelopmentProject";
import DevelopmentProjectRepository from "../../domain/product/DevelopmentProjectRepository";

export default class DevelopmentProjectService extends ApplicationService<DevelopmentProject> {
  private readonly log = LogFactory.get(DevelopmentProjectService.name);

  constructor (eventBus: EventBus,
               private readonly repository: DevelopmentProjectRepository,
               private readonly integration: TicketBoardIntegration){
    super(eventBus);
  }

  byId(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  createFromTicketBoard(command: CreateProjectFromTicketBoard): TE.TaskEither<Error,string> {
      return pipe(
          DevelopmentProject.createFromTicketBoard(command.ticketBoardKey, this.repository, this.integration),
          TE.chainFirst((a) => TE.fromIO(this.log.io.info(`Ticket board ${a.id} created.`))),
          TE.chainFirst(this.publishEventsOf),
          TE.chainFirst(this.repository.save),
          TE.map((ticketBoard => ticketBoard.id))
      )
  }
}
