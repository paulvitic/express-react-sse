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
    ref: number,
    key: string
}

export type Change = {
    type: string,
    from: string,
    fromString: string,
    to: string,
    toString: string,
}

export type ChangeLog = {
    created: string,
    changes: Change[]
}

export type TicketChangeLog = {
    id: number,
    key: string,
    issueType: string,
    changeLog: ChangeLog[]
}

export const ChangeFilter = {
    customfield_10011: {
        field: "Rank",
        fieldId: "customfield_10011",
        use: false,
        type: "rank"
    },
    customfield_10010: {
        field: "Sprint",
        fieldId: "customfield_10010",
        use: true,
        type: "sprint"
    },
    status : {
        field: "status",
        fieldId: "status",
        use: true,
        type: "status"
    },
    issuetype: {
        field: "issuetype",
        fieldId: "issuetype",
        use: true,
        type: "issueType"
    },
    Workflow: {
        field: "Workflow",
        fieldId: undefined,
        use: false,
        type: "workFlow"
    },
    customfield_10031: {
        field: "Story point estimate",
        fieldId: "customfield_10031",
        use: false,
        type: "storyPointEstimate"
    },
    labels: {
        field: "labels",
        fieldId: "labels",
        use: true,
        type: "labels"
    },
    assignee: {
        field: "assignee",
        fieldId: "assignee",
        use: true,
        type: "assignee"
    },
    description: {
        field: "description",
        fieldId: "description",
        use: false,
        type: "description"
    },
    customfield_10017: {
        field: "Complexity Points",
        fieldId: "customfield_10017",
        use: false,
        type: "complexityPoints"
    },
    project: {
        field: "project",
        fieldId: undefined,
        use: true,
        type: "project"
    },
    Key: {
        field: "Key",
        fieldId: undefined,
        use: true,
        type: "key"
    },
    customfield_10008: {
        field: "Epic Link",
        fieldId: "customfield_10008", // check if this can really be used as epic link and therefore product feature
        use: true,
        type: "epicLink"
    }
};

export class TicketBoardIntegrationFailure extends Error {}

export default interface TicketBoardIntegration {
    assertProject(key:string): TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>
    getUpdatedTickets(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]>;
    readTicketChangeLog(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, Option<TicketChangeLog>>
}
