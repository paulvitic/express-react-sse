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
    storyPoints: number,
    parentKey: string,
    sprintCount: number,
    labels: string[],
    changeLog: ChangeLog[]
}

export const ChangeFilter = {
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
    assignee: {
        field: "assignee",
        fieldId: "assignee",
        use: true,
        type: "assignee"
    },
    IssueParentAssociation: {
        field: "IssueParentAssociation", // use this for epic link
        fieldId: undefined,
        use: true,
        type: "parentAssociation"
    },
    labels: {
        field: "labels",
        fieldId: "labels",
        use: true,
        type: "labels"
    },
    customfield_10010: {
        field: "Sprint",
        fieldId: "customfield_10010",
        use: false,
        type: "sprint"
    },
    customfield_10031: {
        field: "Story point estimate",
        fieldId: "customfield_10031",
        use: false,
        type: "storyPointEstimate"
    },
    Key: {
        field: "Key",
        fieldId: undefined,
        use: false,
        type: "key"
    },
    customfield_10008: {
        field: "Epic Link",
        fieldId: "customfield_10008", // it seems this does not work in next gen project
        use: false,
        type: "epicLink"
    },
    resolution: {
        field: "resolution",
        fieldId: "resolution",
        use: false,
        type: "resolution"
    }
};

export class TicketBoardIntegrationFailure extends Error {}

export default interface TicketBoardIntegration {
    assertProject(key:string): TaskEither<TicketBoardIntegrationFailure, TicketBoardInfo>
    getUpdatedTickets(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, UpdatedTicket[]>;
    readTicketChangeLog(key: string, from: Date, to: Date): TaskEither<TicketBoardIntegrationFailure, Option<TicketChangeLog>>
}
