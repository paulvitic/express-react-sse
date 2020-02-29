import AggregateRoot from "../AggregateRoot";
import LogFactory from "../LogFactory";
import TicketUpdate from "./TicketHistory";

export default class Ticket extends AggregateRoot {
    private readonly log = LogFactory.get(Ticket.name);
    private readonly ticketHistory: TicketUpdate[];

    constructor(id: string,
                private _key: string,
                private _externalRef: number,
                private _devProjectId: string) {
        super(id);
        if (!_key || !_externalRef) throw new Error("external id or key can not be undefined.");
    }
}
