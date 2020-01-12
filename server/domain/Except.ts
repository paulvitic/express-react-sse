/**
 *
 */
export interface Failure<T> {
    type: T;
    reason: string;
}

/**
 *
 */
export type Except<F extends Failure<number | string>, S> = Fail<F, S> | Succeed<F, S>;

/**
 *
 */
export class Fail<F extends Failure<number | string>, S> {
    readonly value: F;

    constructor(value: F) {
        this.value = value;
    }

    failed(): this is Fail<F, S> {
        return true;
    }

    succeeded(): this is Succeed<F, S> {
        return false;
    }

    onSuccess<N>(_: (newSuccess: S) => N): Except<F, N> {
        return this as any;
    }

    else(funct: (value: F) => void): void {
        funct(this.value);
    }
}

/**
 *
 */
export class Succeed<F extends Failure<string | number>, S> {
    readonly value: S;

    constructor(value: S) {
        this.value = value;
    }

    failed(): this is Fail<F, S> {
        return false;
    }

    succeeded(): this is Succeed<F, S> {
        return true;
    }

    onSuccess<N>(func: (value: S) => N): Except<F, N> {
        return new Succeed(func(this.value));
    }

    else(_: (value: F) => void): Except<F, S> {
        return new Succeed(this.value);
    }
}

/**
 *
 * @param fail
 */
export const withFailure = <F extends Failure<string | number>, S>(fail: F): Except<F, S> => {
    return new Fail(fail);
};

/**
 *
 * @param success
 */
export const withSuccess = <F extends Failure<string | number>, S>(success: S): Except<F, S> => {
    return new Succeed<F, S>(success);
};
