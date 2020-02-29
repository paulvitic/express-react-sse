import DomainEntity from "../DomainEntity";

export default class TicketUpdate extends DomainEntity {
    private _changeLogRead: boolean;
    private _changed: boolean;

    constructor(id: string,
                readonly externalRef,
                readonly ticketKey) {
        super(id);
        this._changeLogRead = false
    }

    get isChanged() {
        return this._changed
    }

    get isChangeLogRead() {
        return this._changeLogRead
    }

    changed(changed: boolean){
        this._changeLogRead = true;
        this._changed = changed
    }
}
