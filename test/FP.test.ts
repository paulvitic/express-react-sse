import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO";
import * as S from "fp-ts/lib/Semigroup";
import {pipe} from "fp-ts/lib/pipeable";
import * as O from "fp-ts/lib/Option";
import {array} from "fp-ts/lib/Array";
import {console} from "fp-ts";
import * as fs from "fs";
import axios from "axios";

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
        IO.chainFirst(a => log(`Got ${a}`)),
        IO.chain(add)
    );

    expect(res.run()).toEqual(5)
});

// https://dev.to/ksaaskil/using-fp-ts-for-http-requests-and-validation-131c
// https://dev.to/gcanti/interoperability-with-non-functional-code-using-fp-ts-432e
// https://github.com/anotherhale/fp-ts_sync-example/blob/master/src/sync-example.ts
// https://github.com/anotherhale/fp-ts_async-example/blob/master/src/async-example.ts
test('callback to task either', () => {
    //Our file interface and sample data
    interface IFile {
        fileName: string;
        content: string;
    }
    const files: IFile[] = [
        { fileName: "file1.txt", content: "file1" },
        { fileName: "file2.txt", content: "file2" }
    ];

    //turning the node callback into a TaskEither
    const write: (
        filename: string,
        data: string,
        options: any
    ) => TE.TaskEither<NodeJS.ErrnoException, void> = TE.taskify(fs.writeFile);

    //using traverse rather than map and sequence
    const teav: TE.TaskEither<NodeJS.ErrnoException, Array<void>> =
        array.traverse(TE.taskEither)(files, file => write(file.fileName, file.content, {}));

    //running the computation
    teav.run().then(either =>
            either.fold(
                (e: NodeJS.ErrnoException) => console.error(e),
                (a: void[]) => console.log(`${a.length} files written`)
            )
        );
});


test("from promise to TaskEither 1", async () => {
    const get = (url: string): TE.TaskEither<Error, string> => {
        return TE.tryCatch(() => axios(url).then(res => res.data),
            reason => new Error(String(reason))
        )};

    let res = await get('http://google.com').run();
    expect(res).not.toBeNull();
});


test("from Promise to TaskEither 2", async () => {
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

    expect(res).toHaveLength(3);
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

    expect(res1).toHaveLength(1);
    expect(res2).toHaveLength(1);
});

// collect all successes AND failures:
//A.array.sequence(T.task)(arrayOfTaskEithers)

// fail if some failure is encountered:
//A.array.sequence(TE.taskEither)(arrayOfTaskEithers)

describe('async', function () {

    interface IPerson {
        recurringPayment?: number
    }

    const getRecurringPayment = (person: IPerson): E.Either<Error, number> =>
        E.fromNullable(new Error('No Recurring Payment'))(person.recurringPayment);

    const niceNameCheck = (name: string) => {
        if (/dude/i.test(name)) {
            return 'Nice name'
        } else {
            throw new Error('Bad name')
        }
    };


    it('should pass the error to the left fold function', function () {
        return TE.taskEither.of('hello')
            .map(() => {
                throw new Error('aaaaaa')
            })
            .fold(
                // the first argument (or left) is
                // run when the value is null or undefined
                (err) => {
                   expect(err).toEqual('No Recurring Payment')
                },
                // The second argument (or right) is
                // run when the value exists
                () => {
                    throw new Error('This should not run')
                }
            )
            .run()
    })

});


describe('nullable values', function () {

    /**
     * Should run the first function passed to
     * fold when the value is null or undefined.
     *
     * This is the simplest way of using option
     */
    it('Should call the first argument of fold',
        function () {
            const myVal = null;
            O.fromNullable(myVal)
                .fold(
                    // the first argument (or left) is
                    // run when the value is null or undefined
                    () => expect(myVal).toBeNull(),
                    // The second argument (or right) is
                    // run when the value exists
                    () => {throw new Error('This should not run')}
                )
        }
    );

    it('Should pull a list of names',
        function () {
            const names = [
                'Bob Smith',
                'Andy Hedge',
                null,
                'Helen Newbury',
                undefined
            ];

            const getFirstName = (name: string | null | undefined) =>
                O.fromNullable(name).map((name) => name.split(' ')[0]);

            const defaultFirstName = (name: string | null | undefined) =>
                getFirstName(name).alt(O.some('No name'));

            const result = array.traverse(O.option)(names, defaultFirstName).getOrElse([]);

            expect(result).toEqual([
                'Bob',
                'Andy',
                'No name',
                'Helen',
                'No name'
            ])
        }
    )

});

// https://github.com/davetayls/exploring-fp-ts-series/blob/master/src/02-handling-errors/handling-errors.test.ts



