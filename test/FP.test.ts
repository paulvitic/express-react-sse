import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO";
import * as S from "fp-ts/lib/Semigroup";
import {pipe} from "fp-ts/lib/pipeable";
import * as O from "fp-ts/lib/Option";
import {array} from "fp-ts/lib/Array";
import {console} from "fp-ts";

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

test("optional fold to either", async () => {
    let map = {
        some: {
            name : "name",
            ignore: true
        },
        someOther: {
            name : "name",
            ignore: false
        }
    };

    let toEither = (prop:string): E.Either<Error, O.Option<string>> => {
        return  pipe(
            O.fromNullable(map[prop]),
            O.fold<{name: string, ignore: boolean}, E.Either<Error, {name: string, ignore: boolean}>>(
                () => E.left(new Error("field not recognized")),
                filter => E.right(filter)),
            E.chain(filter => filter.ignore ? E.right(O.none) : E.right(O.some(filter.name)))
        );
    };

    let props = ["none", "some", "someOther"];

    let res = array.reduce(props, [], (resEither, prop) => {
        toEither(prop).fold(
            e => resEither.push(E.left(e)),
            s => resEither.push(E.right(s)));
        return resEither;
    });

    expect(res).toHaveLength(3)
    expect(res[0].isLeft()).toBeTruthy();

    expect(res[1].isRight()).toBeTruthy();
    let option = res[1].value as O.Option<string>;
    expect(option.isNone()).toBeTruthy();

    expect(res[2].isRight()).toBeTruthy();
    option = res[2].value as O.Option<string>;
    expect(option.isSome() && option.value==="name").toBeTruthy()
});

test("optional filter", () => {
    let map = {
        some: {
            name : "usedName",
            use: true
        },
        someOther: {
            name : "unUsedName",
            use: false
        }
    };

    let toOption = (prop:string): O.Option<string> => {
        return  pipe(
            O.fromNullable(map[prop]),
            O.filter(filter => filter.use),
            O.map(filter => filter.name)
        );
    };

    let props = ["none", "some", "someOther"];

    let res1 = array.reduce(props, [], (resEither, prop) => {
        toOption(prop).map(name => resEither.push(name));
        return resEither;
    });
    // does the same thing as reduce above
    let res2 = array.filterMap(props, (prop) =>
        toOption(prop)
    );

    expect(res1).toHaveLength(1)
    expect(res2).toHaveLength(1)
});

// collect all successes AND failures:
//A.array.sequence(T.task)(arrayOfTaskEithers)

// fail if some failure is encountered:
//A.array.sequence(TE.taskEither)(arrayOfTaskEithers)



