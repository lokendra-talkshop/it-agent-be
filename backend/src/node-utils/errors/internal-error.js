import { CustomError } from './custom-error';

export class InternalError extends CustomError {
  statusCode = 500;

  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, InternalError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
