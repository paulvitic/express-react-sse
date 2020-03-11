import {AbstractDomainEvent} from "../../DomainEvent";
import {TicketUpdateCollectionPeriod, TicketUpdateCollectionStatus} from "../TicketUpdateCollection";

export class TicketUpdateCollectionUnBlocked extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly status: TicketUpdateCollectionStatus,
        readonly prodDevId: string,
        readonly ticketBoardKey: string,
        readonly period: TicketUpdateCollectionPeriod){
        super(aggregate, aggregateId);
    }
}
