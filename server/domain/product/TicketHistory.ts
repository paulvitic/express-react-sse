
export enum TicketWorkType {
    UNKNOWN,
    PRODUCT_DEVELOPMENT,
    PROJECT,
    CHAPTER,
    SOFTWARE_QA_CHAPTER,
    DATA_SCIENCE_CHAPTER,
    PRODUCT_DESIGN_CHAPTER
}

export type TicketHistory = {
    latest: boolean,
    ticketRef: number,
    ticketKey: string,
    issueType: string,
    workType: TicketWorkType,
    storyPoints: number,
    startedAt: Date,
    endedAt: Date | null,
    duration: number | null,
    sprintCount: number | null,
    status: string | null,
    assignee: string | null,
    prodDevId: string,
    collectionId: string
}
