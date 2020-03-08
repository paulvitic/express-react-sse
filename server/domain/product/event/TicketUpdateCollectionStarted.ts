import {AbstractDomainEvent} from "../../DomainEvent";
import {TicketUpdateCollectionPeriod} from "../TicketUpdateCollection";

export class TicketUpdateCollectionStarted extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        readonly prodDevId: string,
        readonly ticketBoardKey: string,
        readonly period: TicketUpdateCollectionPeriod){
        super(aggregate, aggregateId);
    }
}
