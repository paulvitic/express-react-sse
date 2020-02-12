export default abstract class DomainEntity {

    protected constructor(private _id: string) {}

    get id(): string {
        return this._id;
    }
}
