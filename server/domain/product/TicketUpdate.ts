import DomainEntity from "../DomainEntity";

export default class TicketUpdate extends DomainEntity {
    private _collected: boolean;
    constructor(id: string,
                readonly ref: number,
                readonly key: string,
                collected?: boolean) {
        super(id);
        this._collected = (collected===undefined || collected===null) ? false : collected;
    }

    get collected() {
        return this._collected
    }

    complete(){
        this._collected = true;
    }
}
