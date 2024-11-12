import { CustomError } from './custom-error';

export class NotImplementedError extends CustomError {
  statusCode = 501;

  constructor(message = 'Not Implemented') {
    super(message);
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
