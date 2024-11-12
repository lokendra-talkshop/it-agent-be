import morgan from 'morgan';
import { InternalError } from '../errors/internal-error';
import { loggerInstance } from '../services/custom-logger';
import { middlewareLogLevels } from '../types/enums';

const stream = {
  write: (message) => loggerInstance.http(message),
};

// @ts-ignore
morgan.token('body', (req) => JSON.stringify(req.body || ''));

export const loggerMiddleWare = morgan(':method :url :status :body :res[content-length] - :response-time ms', {
  stream,
});

export class LoggerMiddleware {
  _logger;

  addReqAndResBodyToken(reqBody = 'reqBody', resBody = 'resBody') {
    // @ts-ignore
    morgan.token(reqBody, (req) => JSON.stringify(req.body || ''));
    // @ts-ignore
    morgan.token(resBody, (req, res) => JSON.stringify(res[resBody] || ''));
  }

  changeSendAndJsonMethods(app, resBodyString) {
    const originalSend = app.response.send;
    // @ts-ignore
    app.response.send = function sendOverWrite(body) {
      originalSend.call(this, body);
      // @ts-ignore
      this[resBodyString] = body;
    };

    const originalJson = app.response.json;
    // @ts-ignore
    app.response.json = function jsonOverWrite(body) {
      originalJson.call(this, body);
      // @ts-ignore
      this[resBodyString] = body;
    };
  }

  constructor(subject, level, requestIdHeader = 'x-request-id', app = null) {
    if (level === middlewareLogLevels.info) {
      if (subject === 'req')
        // @ts-ignore
        this._logger = morgan(
          `[REQ] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent`,
          { immediate: true, stream },
        );
      else if (subject === 'res')
        // @ts-ignore
        this._logger = morgan(
          `[RES] :req[${requestIdHeader}] -- :method :url :status :res[content-length] :response-time :total-time`,
          { stream },
        );
      else {
        // @ts-ignore
        this._logger = morgan(
          `[COM] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent | :status :res[content-length] :response-time :total-time`,
          { stream },
        );
      }
    } else {
      const reqBodyString = 'reqBody';
      const resBodyString = 'resBody';

      if (app != null) this.changeSendAndJsonMethods(app, resBodyString);

      this.addReqAndResBodyToken(reqBodyString, resBodyString);

      if (subject === 'req')
        // @ts-ignore
        this._logger = morgan(
          `[REQ] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent :req[Authorization] :${reqBodyString}`,
          { immediate: true, stream },
        );
      else if (subject === 'res')
        // @ts-ignore
        this._logger = morgan(
          `[RES] :req[${requestIdHeader}] -- :method :url :status :res[content-length] :${resBodyString} :response-time :total-time`,
          { stream },
        );
      else {
        // @ts-ignore
        this._logger = morgan(
          `[COM] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent :req[Authorization] :${reqBodyString} | :status :res[content-length] :${resBodyString} :response-time :total-time`,
          { stream },
        );
      }
    }
  }

  get logger() {
    if (!this._logger) throw new InternalError('Error Initializing Logger middleware');
    return this._logger;
  }
}
