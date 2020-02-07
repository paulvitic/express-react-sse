export default abstract class DomainEntity {

    protected constructor(private _id: string,
                          private _exists?: boolean) {
        if (_exists===undefined) this._exists = true;
    }

    get id(): string {
        return this._id;
    }

    get exists(): boolean {
        return this._exists;
    }
}
