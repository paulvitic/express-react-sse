export default abstract class DomainEntity {

    protected constructor(private _id: string) {
        if (_id === null || undefined) throw new Error("entity id can not be null")
    }

    get id(): string {
        return this._id;
    }
}
