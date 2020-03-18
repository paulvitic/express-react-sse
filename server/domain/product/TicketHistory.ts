
export type TicketHistory = {
    latest: boolean
    prodDevId: string
    ticketRef: number,
    ticketKey: string,
    issueType: string,
    storyPoints: number,
    startedAt: Date,
    endedAt: Date | null,
    duration: number | null,
    sprintCount: number | null,
    status: string | null,
    forChapter: boolean | null,
    chapter: string | null,
    assignee: string | null,
    forProductDev: boolean | null
}
