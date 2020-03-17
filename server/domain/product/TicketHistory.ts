
export type TicketHistory = {
    latest: boolean
    prodDevId: string
    ticketRef: number,
    ticketKey: string,
    startedAt: Date,
    endedAt: Date | null,
    duration: number | null,
    sprint: string | null,
    sprintCount: number | null,
    status: string | null,
    issueType: string | null,
    forChapter: boolean | null,
    chapter: string | null,
    assignee: string | null,
    forProductDev: boolean | null
}
