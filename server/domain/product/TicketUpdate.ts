import DomainEntity from "../DomainEntity";

export default class TicketUpdate extends DomainEntity {
    private _collected: boolean;

    constructor(id: string,
                readonly externalRef: number,
                readonly ticketKey: string,
                collected?: boolean) {
        super(id);
        this._collected = collected === undefined ? false : collected;
    }

    get collected() {
        return this._collected
    }

    collect(){
        this._collected = true;
    }
}
