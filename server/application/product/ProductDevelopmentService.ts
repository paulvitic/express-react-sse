import {pipe} from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import LogFactory from "../../domain/LogFactory";
import EventBus from "../../domain/EventBus";
import TicketBoard from "../../domain/product/TicketBoard";
import TicketBoardIntegration from "../../domain/product/service/TicketBoardIntegration";
import ProductDevelopment, {ProductDevelopmentError} from "../../domain/product/ProductDevelopment";
import ProductDevelopmentRepository from "../../domain/product/repository/ProductDevelopmentRepository";
import {CreateProjectFromTicketBoard} from "./commands";

export default class ProductDevelopmentService {
  private readonly log = LogFactory.get(ProductDevelopmentService.name);

  constructor (private readonly eventBus: EventBus,
               private readonly repository: ProductDevelopmentRepository,
               private readonly integration: TicketBoardIntegration){
  }

  getById(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  createFromTicketBoard(command: CreateProjectFromTicketBoard): TE.TaskEither<Error,string> {
      return pipe(
          this.repository.findOneByTicketBoardKey(command.ticketBoardKey),
          TE.filterOrElse(found => found.isNone(),
              () => new ProductDevelopmentError('Ticket board key already exists')),
          TE.chain(() => ProductDevelopment.createFromTicketBoard(command.ticketBoardKey, command.defaultStart, this.integration)),
          TE.chainFirst(this.eventBus.publishEventsOf),
          TE.chainFirst(this.repository.save),
          TE.chainFirst(prodDev => TE.rightIO(this.log.io.info(`Product development ${prodDev.id} created.`))),
          TE.map((prodDev => prodDev.id))
      )
  }
}
