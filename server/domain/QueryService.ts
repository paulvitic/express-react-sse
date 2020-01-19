import AggregateRoot from "./AggregateRoot";

export interface QueryService<T extends AggregateRoot> {
    exists(id: string): Promise<boolean>;
    findOne(aggregateType: string, id: string): Promise<T>;
    execute(query: any): Promise<T[]>;
}
