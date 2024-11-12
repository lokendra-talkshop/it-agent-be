import { v4 as uuid } from 'uuid';

export const attachRequestIds = (
  options = {
    setHeader: true,
    headerName: 'x-request-id',
  },
) =>
  function (request, response, next) {
    const oldValue = request.get(options.headerName);
    const id = oldValue === undefined ? uuid() : oldValue;

    if (options.setHeader) {
      // response.set(options.headerName, id);
      request.headers[options.headerName] = id;
    }
    next();
  };
