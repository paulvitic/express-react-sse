import {IO} from "fp-ts/lib/IO";

export type Logger = {
    error: (message: string, ...meta: any[]) => void
    warn: (message: string, ...meta: any[]) => void
    info: (message: string, ...meta: any[]) => void
    debug: (message: string, ...meta: any[]) => void
    io: {
        error: (message: string, ...meta: any[]) => IO<void>
        warn: (m: string) => IO<void>,
        info: (m: string) => IO<void>,
        debug: (m: string) => IO<void>,
    }
}

export default class LogFactory {
    private static delegate;

    public static get(module?: string): Logger {
        return LogFactory.delegate.get(module)
    }

    public static init(delegate){
        LogFactory.delegate = delegate;
    }

    static setLogLevel(logLevel: string) {
        LogFactory.delegate.setLogLevel(logLevel)
    }
}
