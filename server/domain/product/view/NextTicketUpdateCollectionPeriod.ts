export class NextTicketUpdateCollectionPeriod {
    constructor(readonly devProjectId: string,
                readonly ticketBoardKey: string,
                readonly devProjectStartedOn: Date,
                readonly lastTicketUpdateCollectionPeriodEnd: Date) {}
}
