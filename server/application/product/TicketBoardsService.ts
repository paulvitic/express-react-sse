import LogFactory from "../../infrastructure/context/LogFactory";
import ApplicationService from "../ApplicationService";
import EventBus from "../../domain/EventBus";
import {Repository} from "../../domain/Repository";
import TicketBoard from "../../domain/product/TicketBoard";
import AddTicketBoard from "./commands/AddTicketBoard";
import {TicketBoardsQueryService} from "../../infrastructure/persistence/RedisQueryService";
import TicketBoardIntegration from "../../domain/product/TicketBoardIntegration";
import {TicketBoardRepository} from "../../domain/product/TicketBoardRepository";
import {either, Either, left, right} from "fp-ts/lib/Either";
import {pipe} from "fp-ts/lib/pipeable";
import {chain} from "fp-ts/lib/TaskEither";


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

  addTicketBoard(command: AddTicketBoard): Promise<Either<Error,string>> {
      return new Promise<Either<Error,string>>( async (resolve, reject) => {
          let exists = await this.repository.findOneByExternalKey(command.key);

          if (exists.isNone()) {
              let created = await TicketBoard.create(command.key, this.integration);
              if (created.isRight()) {
                  this.publishEventsOf(created.value);
                  let saved = await this.repository.save(created.value);
                  // see: https://dev.to/gcanti/getting-started-with-fp-ts-either-vs-validation-5eja
                  /*pipe(
                      await this.repository.save(created.value),
                      chain(oneCapital),
                      chain(oneNumber)
                  );*/
                  if (saved.isRight()) {
                      resolve(right(saved.value.id))
                  } else {
                      resolve(left(new Error(saved.value.message)));
                  }
              } else {
                  resolve(left(new Error(created.value.message)));
              }
          } else {
              resolve(left(new Error("Exists")))
          }
      })
  }
}
