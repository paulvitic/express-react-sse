import DomainEntity from "../DomainEntity";

export default class TicketBoard extends DomainEntity {
    static PRODUCT_DEV_PROJECT_CATEGORY = "Product Development";
    constructor(id: string,
                private _key: string,
                private _ref: number,
                private readonly _productDevId: string) {
        super(id);
        if (!_key || !_ref) throw new Error("external id or key can not be undefined.");
    }

    get ref() {
        return this._ref;
    }

    get key() {
        return this._key;
    }

    get productDevId(): string {
        return this._productDevId
    }
}
