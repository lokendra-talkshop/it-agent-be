import { CustomError } from '../errors/custom-error';
import { loggerInstance } from '../services/custom-logger';

export const errorHandlers = (err, req, res, next) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).send({ errors: err.serializeErrors() });
  } else {
    loggerInstance.info('Unknown error', err);
    res.status(400).send({
      errors: [
        {
          message: 'Something went wrong.',
        },
      ],
    });
  }

  next();
};

export default {
  errorHandlers,
};
