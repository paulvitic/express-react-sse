import winston, {LoggerOptions, createLogger, format, transports} from 'winston';

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
