import {AbstractDomainEvent} from "../../DomainEvent";
import {TicketUpdateCollectionPeriod} from "../TicketUpdateCollection";
import {UpdatedTicket} from "../service/TicketBoardIntegration";

export class TicketChanged extends AbstractDomainEvent {
    constructor(
        aggregate: string,
        aggregateId: string,
        sequence: number){
        super(aggregate, aggregateId, sequence);}
}
