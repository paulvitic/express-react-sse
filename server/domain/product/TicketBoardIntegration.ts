import {Either} from "fp-ts/lib/Either";
import {TaskEither} from "fp-ts/lib/TaskEither";

export type TicketBoardInfo = {
    id: number,
    key: string,
    name: string,
    description: string,
    category: {
        id: number
        name: string,
        description: string
    }
}

export class TicketBoardIntegrationFailure extends Error {}

export default interface TicketBoardIntegration {
    assertProject(key:string): TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>
}
