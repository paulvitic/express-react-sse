import TicketBoard from "../../domain/product/TicketBoard";
import {Repository} from "../Repository";

export interface TicketBoardRepository extends Repository<TicketBoard> {
    findOneByExternalKey(key: string): Promise<TicketBoard>
}

