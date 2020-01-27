/**
 *
 */
import {Either} from "fp-ts/lib/Either";

export interface Repository<T> {
    find(item: T): Promise<T[]>;
    findOne(id: string): Promise<T>;
    save(item: T): Promise<Either<Error, T>>;
    update(id: string, item: T): Promise<T>;
    delete(id: string): Promise<Either<Error, boolean>>;
}
