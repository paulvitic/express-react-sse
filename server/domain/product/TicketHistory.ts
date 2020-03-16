
export type TicketHistory = {
    current: boolean
    productDevId: string
    ticketRef: number,
    ticketKey: string,
    startedAt: Date,
    endedAt: Date,
    duration: number,
    sprint: string,
    sprintCount: number,
    status: string,
    issueType: string,
    forChapter: boolean,
    chapter: string,
    assignee: string,
    forProductDev: boolean
}
