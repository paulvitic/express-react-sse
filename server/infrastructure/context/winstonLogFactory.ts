import winston, {LoggerOptions, format} from 'winston';
import * as IO from "fp-ts/lib/IO";

const DEFAULT_CATEGORY = 'DEFAULT';

const logLevel = process.env.LOG_LEVEL || process.env.NODE_ENV==="test" ? "debug" : "info";

const transports = {
    console: new winston.transports.Console({ level: logLevel})
};

const options = (category: string): LoggerOptions => {
    return {
        transports: [
            transports.console
        ],
        format: format.combine(
            format.label({
                label: category
            }),
            format.timestamp(),
            format.colorize(),
            format.printf((info) => {
                return `${info.timestamp} - ${info.label}[${info.level}]: ${info.message}`;
            })
        )
    };
};

const add = (module: string) => {
    winston.loggers.add(module, options(module));
};

const DEFAULT_LOGGER = (() => {
    add(DEFAULT_CATEGORY);
    return winston.loggers.get(DEFAULT_CATEGORY)
})();


export default class WinstonLogFactory {

    get(module: string | undefined) {
        let winstonLogger;
        if (module) {
            if (!winston.loggers.has(module)) {
                add(module);
            }
            winstonLogger = winston.loggers.get(module);
        } else {
            winstonLogger = DEFAULT_LOGGER;
        }

        return {
            error: (message: string, ...meta: any[]) => winstonLogger.error(message, meta),
            warn: (message: string, ...meta: any[]) => winstonLogger.warn(message, meta),
            info: (message: string, ...meta: any[]) => winstonLogger.info(message, meta),
            debug: (message: string, ...meta: any[]) => winstonLogger.debug(message, meta),
            io: {
                error: (message: string, ...meta: any[]) => new IO.IO<void>(() => winstonLogger.error(message, meta)),
                warn: (message: string, ...meta: any[]) => new IO.IO<void>(() => winstonLogger.warn(message, meta)),
                info: (message: string, ...meta: any[]) => new IO.IO<void>(() => winstonLogger.info(message, meta)),
                debug: (message: string, ...meta: any[]) => new IO.IO<void>(() => winstonLogger.debug(message, meta)),
            }
        }
    }

    setLogLevel(logLevel: string){
        transports.console.level = logLevel;
    }
}
