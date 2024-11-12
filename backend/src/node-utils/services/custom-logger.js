import winston from 'winston';
import { NodeEnvs } from '../types/nodeEnvs';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  socket: 3,
  debug: 5,
  silly: 6,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  socket: 'magenta',
  debug: 'blue',
  silly: 'white',
};

winston.addColors(colors);

const getLevel = () => {
  const env = process.env.ENVIRONMENT || NodeEnvs.dev;
  return env === NodeEnvs.prod ? 'info' : 'debug';
};

class Logger {
  _logger = null;

  get logger() {
    if (this._logger == null) {
      throw new Error('Logger not initialized.');
    }
    return this._logger;
  }

  format(service) {
    return winston.format.combine(
      winston.format.timestamp({
        format: () =>
          new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Calcutta',
            hour12: false,
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          }),
      }),
      // winston.format.colorize({ level: true }),
      winston.format.errors({ message: true }),
      winston.format.json(),
      // winston.format.printf((info) => {
      //   let str;
      //   try {
      //     const { level, timestamp, stack, ...message } = info;
      //     str = `[${service.toUpperCase()}] - ${info.timestamp} | ${level.toUpperCase()}`;
      //     if (message)
      //       str += ` | MESSAGE- ${Object.values(message)
      //         .map((m) => {
      //           if (m instanceof Error) {
      //             // eslint-disable-next-line no-shadow
      //             const { message, stack, name } = m;
      //             const arr = [];
      //             if (message) arr.push(stringify(message));
      //             if (name) arr.push(stringify(name));
      //             if (stack) arr.push(stringify(stack));
      //             return arr.join(' > ');
      //           }
      //           return stringify(m);
      //         })
      //         .join(' - ')}`;
      //     // if (meta) str += ` | META-${stringify(meta)}`;
      //     // if (stack) str += ` | STACK- ${stringify(stack)}`;
      //     return str;
      //   } catch (err) {
      //     return `${str} | LOG_ERROR`;
      //   }
      // }),
    );
  }

  initialize(service = 'service', level = null) {
    this._logger = winston.createLogger({
      level: level != null ? level : getLevel(),
      levels,
      format: this.format(service),
      transports: [new winston.transports.Console()],
      handleExceptions: true,
    });
  }

  info(message) {
    this.logger.log('info', message);
  }

  debug(message) {
    this.logger.log('debug', message);
  }

  error(message) {
    this.logger.log('error', message);
  }

  warn(message) {
    this.logger.log('warn', message);
  }

  silly(message) {
    this.logger.log('silly', message);
  }

  http(message) {
    this.logger.log('http', message);
  }

  socket(message) {
    this.logger.log('socket', message);
  }
}

export const loggerInstance = new Logger();
