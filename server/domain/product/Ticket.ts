import AggregateRoot from "../AggregateRoot";
import LogFactory from "../LogFactory";

export default class Ticket extends AggregateRoot {
    private readonly log = LogFactory.get(Ticket.name);

    constructor(id: string,
                private _key: string,
                private _externalRef: number) {
        super(id);
        if (!_key || !_externalRef) throw new Error("external id or key can not be undefined.");
    }
}
