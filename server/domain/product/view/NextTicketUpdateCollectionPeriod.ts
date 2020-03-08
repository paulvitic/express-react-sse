export class NextTicketUpdateCollectionPeriod {
    constructor(readonly prodDevId: string,
                readonly ticketBoardKey: string,
                readonly devProjectStartedOn: Date,
                readonly lastTicketUpdateCollectionPeriodEnd: Date) {}
}
