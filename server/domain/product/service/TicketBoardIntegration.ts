import {TaskEither} from "fp-ts/lib/TaskEither";
import {TicketUpdateCollectionPeriod} from "../TicketUpdateCollection";

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

export type ChangeLog = {
    field: string,
    timestamp: Date,
    from: string,
    fromString: string,
    to: string,
    toString: string,
}

export type TicketChangelog = {
    id: number,
    key: string,
    changeLog: ChangeLog[]
}

export class TicketBoardIntegrationFailure extends Error {}

export default interface TicketBoardIntegration {
    assertProject(key:string): TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>
    getUpdatedTickets(key: string, period: TicketUpdateCollectionPeriod): TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]>;
}
