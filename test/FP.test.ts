import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO";
import * as S from "fp-ts/lib/Semigroup";
import {pipe} from "fp-ts/lib/pipeable";

// Folding: https://dev.to/gcanti/getting-started-with-fp-ts-semigroup-2mf7
// By definition concat works with only two elements of A, what if we want to concat more elements?
// The fold function takes a semigroup instance, an initial value and an array of elements:
test("Either fold", () => {
    function onLeft(errors: Array<string>): string {
        return `Errors: ${errors.join(', ')}`
    }

    function onRight(value: number): string {
        return `Ok: ${value}`
    }

    let res = pipe(
        E.right(1),
        E.fold(onLeft, onRight)
    );
    expect(res).toEqual('Ok: 1');

    let res2 = pipe(
        E.left(['error 1', 'error 2']),
        E.fold(onLeft, onRight)
    );
    expect(res2).toEqual('Errors: error 1, error 2')
});

test("semi group fold", () => {
    const sum = S.fold(S.semigroupSum);
    let res = sum(0)([1, 2, 3, 4]);
    expect(res).toEqual(10) // 10
});

test("chain log", () => {
    const log = (m: string): IO.IO<void> => {
        return new IO.IO<void>(()=> {
            console.log(m);
        });
    };
    const a = (n: number): IO.IO<number> => {
        return new IO.IO<number>(() => n);
    };
    const add = (n: number): IO.IO<number> => {
        return new IO.IO<number>(() => n +3);
    };

    let res = pipe(
        a(2),
        IO.chainFirst((a) => log(`Got ${a}`)),
        IO.chain(add)
    );

    expect(res.run()).toEqual(5)
});

// https://dev.to/ksaaskil/using-fp-ts-for-http-requests-and-validation-131c
// https://dev.to/gcanti/interoperability-with-non-functional-code-using-fp-ts-432e
// https://github.com/anotherhale/fp-ts_sync-example/blob/master/src/sync-example.ts
test("from Promise to Task", async () => {
    interface AppConfig {
        service: {
            interface: string
            port: number
        };
    }

    let convert = () => {
        return new Promise<string>(resolve => {
            resolve('resolved')}
        )};
    let converted = await convert();
    expect(converted).toEqual("resolved")
});


test("from Promise to TaskEither", async () => {
    let resolvedPromise = () => new Promise<string>( resolve => {
        resolve("resolved")
    });

    let rejectedPromise = new Promise<string>( (resolve, reject) => {
        reject(new Error("rejected"))
    });

    let resolvedRes = (): TE.TaskEither<Error, string> => {
        return TE.tryCatch(
            () => resolvedPromise().then(res => res),
            reason => new Error(String(reason))
        )
    };

    let res = await resolvedRes().run();
    expect(res.isRight()).toEqual(true)
});
