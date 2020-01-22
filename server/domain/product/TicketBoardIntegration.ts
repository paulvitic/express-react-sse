import {Except, Failure} from "../Except";

export type TicketBoardInfo = {
    id: string,
    key: string,
    name: string,
    description: string,
    category: {
        id: string
        name: string,
        description: string
    }
}

export class TicketBoardIntegrationFailure implements Failure<string> {
    reason: string;
    type: string;
}

export default interface TicketBoardIntegration {
    assertProject(key:string): Promise<Except<TicketBoardIntegrationFailure, TicketBoardInfo>>
}
