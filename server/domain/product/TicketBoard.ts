import LogFactory from "../LogFactory";
import DomainEntity from "../DomainEntity";

export default class TicketBoard extends DomainEntity {
    static PRODUCT_DEV_PROJECT_CATEGORY = "Product Development";
    private readonly log = LogFactory.get(TicketBoard.name);

    constructor(id: string,
                private _key: string,
                private _externalRef: number) {
        super(id);
        if (!_key || !_externalRef) throw new Error("external id or key can not be undefined.");
    }

    get externalRef() {
        return this._externalRef;
    }

    get key() {
        return this._key;
    }
}
