import LogFactory from "../../infrastructure/context/LogFactory";
import ApplicationService from "../ApplicationService";
import EventBus from "../../domain/EventBus";
import {Repository} from "../../domain/Repository";
import TicketBoard from "../../domain/product/TicketBoard";
import AddTicketBoard from "./commands/AddTicketBoard";


export default class TicketBoardsService extends ApplicationService<TicketBoard> {
  private readonly log = LogFactory.get(TicketBoardsService.name);

  constructor (eventBus: EventBus,
               repository: Repository<TicketBoard>){
    super(eventBus,repository);
  }

  byId(id: number): Promise<TicketBoard> {
    throw new Error('not implemented');
  }

  addTicketBoard(command: AddTicketBoard): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      let exists = await this.repository.findOne(command.key);
      let outcome = await TicketBoard.create(command.key);

      outcome.onSuccess(ticketBoard => {
        this.publishEventsOf(ticketBoard);
        this.repository.save(ticketBoard);
        resolve(command.key)

      }).else((exception) => {
        reject(new Error(exception.reason));
      })
    })
  }
}
