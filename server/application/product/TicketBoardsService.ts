import LogFactory from "../../infrastructure/context/LogFactory";
import ApplicationService from "../ApplicationService";
import EventBus from "../../domain/EventBus";
import {Repository} from "../../domain/Repository";
import TicketBoard from "../../domain/product/TicketBoard";


export default class TicketBoardsService extends ApplicationService<TicketBoard> {
  private readonly log = LogFactory.get(TicketBoardsService.name);

  constructor (eventBus: EventBus,
               repository: Repository<TicketBoard>){
    super(eventBus,repository);
  }

  byId(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  create(name: string): Promise<TicketBoard> {
    throw new Error('not implemented');
  }
}
