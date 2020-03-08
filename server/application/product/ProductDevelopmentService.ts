import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import ApplicationService from "../ApplicationService";
import LogFactory from "../../domain/LogFactory";
import EventBus from "../../domain/EventBus";
import TicketBoard from "../../domain/product/TicketBoard";
import TicketBoardIntegration from "../../domain/product/service/TicketBoardIntegration";
import ProductDevelopment from "../../domain/product/ProductDevelopment";
import ProductDevelopmentRepository from "../../domain/product/repository/ProductDevelopmentRepository";
import {CollectTicketUpdates, CreateProjectFromTicketBoard} from "./commands";

export default class ProductDevelopmentService extends ApplicationService<ProductDevelopment> {
  private readonly log = LogFactory.get(ProductDevelopmentService.name);

  constructor (eventBus: EventBus,
               private readonly repository: ProductDevelopmentRepository,
               private readonly integration: TicketBoardIntegration){
    super(eventBus);
  }

  getById(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  createFromTicketBoard(command: CreateProjectFromTicketBoard): TE.TaskEither<Error,string> {
      return pipe(
          ProductDevelopment.createFromTicketBoard(command.ticketBoardKey, this.repository, this.integration),
          TE.chainFirst(this.publishEventsOf),
          TE.chainFirst(this.repository.save),
          TE.chainFirst(prodDev => TE.rightIO(this.log.io.info(`Product development ${prodDev.id} created.`))),
          TE.map((prodDev => prodDev.id))
      )
  }

  collectTicketUpdates(command: CollectTicketUpdates): TE.TaskEither<Error, boolean> {
    return pipe(
        this.repository.findById(command.prodDevId),
        TE.chain(devProject => TE.taskEither.of(devProject.isSome()))
    )
  }
}
