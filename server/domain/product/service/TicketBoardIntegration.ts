import {TaskEither} from "fp-ts/lib/TaskEither";
import {Option} from "fp-ts/lib/Option";

export type TicketBoardInfo = {
    id: number,
    key: string,
    name: string,
    description: string,
    created: Date,
    projectCategory: {
        id: number
        name: string,
        description: string
    }
}

export type UpdatedTicket = {
    id: number,
    key: string
}

export type ChangeLog = {
    field: string,
    timeStamp: string,
    from: string,
    fromString: string,
    to: string,
    toString: string,
}

export type TicketChangeLog = {
    id: number,
    key: string,
    changeLog: ChangeLog[]
}

export class TicketBoardIntegrationFailure extends Error {}

export default interface TicketBoardIntegration {
    assertProject(key:string): TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>
    getUpdatedTickets(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]>;
    readTicketChangeLog(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, Option<TicketChangeLog>>
}
