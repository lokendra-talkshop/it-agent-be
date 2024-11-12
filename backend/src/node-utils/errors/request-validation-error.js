import { CustomError } from './custom-error';

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(errors) {
    super('Invalid request parameters');
    this._errors = errors;

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    try {
      return this.errors.map((error) => {
        const { msg, path } = error;
        return {
          message: msg,
          field: path,
        };
      });
    } catch {
      return [{ message: 'Invalid request parameters' }];
    }
  }
}
