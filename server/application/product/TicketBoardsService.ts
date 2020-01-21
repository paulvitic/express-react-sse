import LogFactory from "../../infrastructure/context/LogFactory";
import ApplicationService from "../ApplicationService";
import EventBus from "../../domain/EventBus";
import {Repository} from "../../domain/Repository";
import TicketBoard from "../../domain/product/TicketBoard";
import AddTicketBoard from "./commands/AddTicketBoard";
import {TicketBoardsQueryService} from "../../infrastructure/persistence/RedisQueryService";
import TicketBoardIntegration from "../../domain/product/TicketBoardIntegration";


export default class TicketBoardsService extends ApplicationService<TicketBoard> {
  private readonly log = LogFactory.get(TicketBoardsService.name);

  constructor (eventBus: EventBus,
               repository: Repository<TicketBoard>,
               private readonly queryService: TicketBoardsQueryService,
               private readonly integration: TicketBoardIntegration){
    super(eventBus,repository);
  }

  byId(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  addTicketBoard(command: AddTicketBoard): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      TicketBoard.create(command.key, this.queryService, this.integration)
          .then(result => {
            result.onSuccess(ticketBoard => {
              this.publishEventsOf(ticketBoard);
              this.repository.save(ticketBoard);
              resolve(command.key)
            }).else((exception) => {
              reject(new Error(exception.reason));
            })
          });
    })
  }
}
