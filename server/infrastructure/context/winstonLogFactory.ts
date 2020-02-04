import winston, {LoggerOptions, format, transports} from 'winston';
import * as IO from "fp-ts/lib/IO";

const DEFAULT_CATEGORY = 'DEFAULT';

const options = (category: string): LoggerOptions => {
  return {
    level: "info",
    transports: [
        new transports.Console()
    ],
    format: format.combine(
        format.label({
          label: category
        }),
        format.timestamp(),
        format.printf((info) => {
          return `${info.timestamp} - ${info.label}:[${info.level}]: ${info.message}`;
        })
    )
  };
};

const add = (module:string) => {
  winston.loggers.add(module, options(module));
};

const DEFAULT_LOGGER = (() => {
  add(DEFAULT_CATEGORY);
  return winston.loggers.get(DEFAULT_CATEGORY)
})();


export default class WinstonLogFactory {
  // TODO abstract LogFactory return type and create an interface for LogFactory at domain
  public get(module:string | undefined) {
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
        error: m => winstonLogger.error(m),
        warn: winstonLogger.warn,
        info:  m => winstonLogger.info(m),
        debug: winstonLogger.debug,
        io: {
            error:  m => new IO.IO<void>(()=> winstonLogger.error(m)),
            warn:  m => new IO.IO<void>(()=> winstonLogger.warn(m)),
            info: m => new IO.IO<void>(()=> winstonLogger.info(m)),
            debug:  m => new IO.IO<void>(()=> winstonLogger.debug(m)),
        }
    }
  }
}
