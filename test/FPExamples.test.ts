import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
// convert nodejs-callback-style function to function returning TaskEither
// const readFile = taskify(fs.readFile);

/**
function getConf(filePath: string): TaskEither<unknown, AppConfig> {
    return pipe(
        readFile(path.resolve(filePath)),
        chain(readYamlAsTaskEither)
    );
}**/


// from Promise to Task:
// =================
const read: T.Task<string> = () => {return new Promise<string>(resolve => {resolve('resolve')})}


// From Promise to TaskEither
// ==========================
const get = (url: string): TE.TaskEither<Error, string> => {
    return TE.tryCatch(
        () => fetch(url).then(res => res.text()),
        reason => new Error(String(reason))
    )
};
// const readYamlAsTaskEither = r => tryCatch(() => readYaml(r), e => e);

// From callback to Task Either
// ============================
//const readFile = TE.taskify(fs.readFile);


// See: https://dev.to/ksaaskil/using-fp-ts-for-http-requests-and-validation-131c
// https://dev.to/gcanti/interoperability-with-non-functional-code-using-fp-ts-432e



// see: https://github.com/anotherhale/fp-ts_sync-example/blob/master/src/sync-example.ts


// Folding: https://dev.to/gcanti/getting-started-with-fp-ts-semigroup-2mf7
// By definition concat works with only two elements of A, what if we want to concat more elements?
// The fold function takes a semigroup instance, an initial value and an array of elements:

import { fold, semigroupSum, semigroupProduct } from 'fp-ts/lib/Semigroup'
const sum = fold(semigroupSum);
sum(0, [1, 2, 3, 4]) // 10

import { fold, left, right } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

function onLeft(errors: Array<string>): string {
    return `Errors: ${errors.join(', ')}`
}

function onRight(value: number): string {
    return `Ok: ${value}`
}

assert.strictEqual(pipe(
    right(1),
    fold(onLeft, onRight))
    , 'Ok: 1')
assert.strictEqual(pipe(left(['error 1', 'error 2']), fold(onLeft, onRight)), 'Errors: error 1, error 2')

