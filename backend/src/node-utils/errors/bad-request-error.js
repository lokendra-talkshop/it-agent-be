import { CustomError } from './custom-error';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(error) {
    super(typeof error === 'string' ? error : 'Invalid request');
    this.error = error;
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors() {
    return typeof this.error === 'string' ? [{ message: this.message }] : [{ ...this.error }];
  }
}
