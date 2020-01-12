import winston, {LoggerOptions, format, transports} from 'winston';

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


export default class LogFactory {
  // TODO change value to an abstraction for logger
  static loggers: Map<string, any>;

  // TODO abstract LogFactory return type and create an interface for LogFactory at domain
  public static get(module:string | undefined) {
    if (module) {

      if (!winston.loggers.has(module)) {
        add(module);
      }
      return winston.loggers.get(module);
    }
    return DEFAULT_LOGGER;
  }
}
