import TicketBoard from "../../domain/product/TicketBoard";
import {Repository} from "../Repository";
import {Option} from "fp-ts/lib/Option";

export interface TicketBoardRepository extends Repository<TicketBoard> {
    findOneByExternalKey(key: string): Promise<Option<TicketBoard>>
}

