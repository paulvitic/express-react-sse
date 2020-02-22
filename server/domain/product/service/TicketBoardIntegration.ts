import {TaskEither} from "fp-ts/lib/TaskEither";

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
    key: string,
    updated: Date,
    created: Date
}

export class TicketBoardIntegrationFailure extends Error {}

export default interface TicketBoardIntegration {
    assertProject(key:string): TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>
    getUpdatedTickets(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]>;
}
