import {IO} from "fp-ts/lib/IO";

// TODO make a LogFactory interface returning this function with log levels
// https://github.com/anotherhale/fp-ts_sync-example/blob/master/src/sync-example.ts
const log = (s: unknown): IO<void> => () => console.log(s);
