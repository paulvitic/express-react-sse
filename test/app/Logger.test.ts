import 'mocha';
import LogFactory from "../../server/app/LogFactory";
import winston, {createLogger, format, transports} from 'winston';

describe('LoggerFactory', () => {
  it('should get all examples', () => {
      const log = LogFactory.get("Test");
      log.info("test")
  });

  it('test', () => {
      /*const defaultLevels = winston.({
          level: 'silly',
          format: winston.format.simple(),
          transports: new winston.transports.Console()
      });

      function logAllLevels() {
          Object.keys(winston.config.npm.levels).forEach(level => {
              defaultLevels[level](`is logged when logger.level="${defaultLevels.level}"`);
          });
      }

      logAllLevels();

      defaultLevels.level = 'error';
      logAllLevels();*/
  });

  it('test get', () => {
    winston.loggers.add("test", {
        level: 'silly',
        transports:[ new winston.transports.Console()]
    });

    winston.loggers.get("test").info("test");
  });

    it('test sophisticated', () => {
        const logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.errors({ stack: true }),
                format.splat(),
                format.json(),
                format.colorize(),
                format.splat(),
                format.simple()
            ),
            defaultMeta: { service: 'your-service-name' },
            transports: [
                new transports.Console()
            ]
        });

        logger.log({
            level: 'info',
            message: 'Pass an object and this works',
            additional: 'properties',
            are: 'passed along'
        });

        logger.info({
            message: 'Use a helper method if you want',
            additional: 'properties',
            are: 'passed along'
        });

        logger.log('info', 'Pass a message and this works', {
            additional: 'properties',
            are: 'passed along'
        });

        logger.info('Use a helper method if you want', {
            additional: 'properties',
            are: 'passed along'
        });

// ***************
// Allows for string interpolation
// ***************

// info: test message my string {}
        logger.log('info', 'test message %s', 'my string');

// info: test message my 123 {}
        logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
        logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });

// prints "Found error at %s"
        logger.info('Found %s at %s', 'error', new Date());
        logger.info('Found %s at %s', 'error', new Error('chill winston'));
        logger.info('Found %s at %s', 'error', /WUT/);
        logger.info('Found %s at %s', 'error', true);
        logger.info('Found %s at %s', 'error', 100.00);
        logger.info('Found %s at %s', 'error', ['1, 2, 3']);

// ***************
// Allows for logging Error instances
// ***************

        logger.warn(new Error('Error passed as info'));
        //logger.log('error', new Error('Error passed as message'));

        logger.warn('Maybe important error: ', new Error('Error passed as meta'));
        logger.log('error', 'Important error: ', new Error('Error passed as meta'));

        logger.error(new Error('Error as info'));

    })
});
