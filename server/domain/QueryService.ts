import AggregateRoot from "./AggregateRoot";

export interface QueryService<T extends AggregateRoot> {
    exists(id: string): Promise<boolean>;
    findOne(id: string): Promise<T>;
    search(query: any): Promise<T[]>;
}
