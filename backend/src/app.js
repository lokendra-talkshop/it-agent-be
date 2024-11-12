import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import 'express-async-errors';
import bearerToken from 'express-bearer-token';
import expressOasGenerator from 'express-oas-generator';
// import AWSXRay from 'aws-xray-sdk';
// eslint-disable-next-line import/no-extraneous-dependencies
import apiMetrics from 'prometheus-api-metrics';
import {
  LoggerMiddleware,
  NotFoundError,
  attachRequestIds,
  errorHandlers,
  middlewareLogLevels,
  probeRoutes,
  
  loggerInstance,
} from './node-utils';

import { v1Router } from './routes-v1';

const app = express();

// app.use(AWSXRay.express.openSegment('Onlybants'));

expressOasGenerator.handleResponses(app, {
  predefinedSpec(spec) {
    return spec;
  },
  specOutputPath: 'spec.json',
});
app.use(
  apiMetrics({
    additionalLabels: ['environment'],
    extractAdditionalLabelValuesFn: (req, res) => ({
      environment: process.env.ENVIRONMENT,
    }),
  }),
);
app.set('trust proxy', true);
app.use(json());
app.use(
  cors({
    origin: '*',
  }),
);
app.use(bearerToken({ headerKey: 'Bearer' }));
app.use(attachRequestIds());
app.use(new LoggerMiddleware('req', middlewareLogLevels.debug, 'x-request-id').logger);
app.use(new LoggerMiddleware('res', middlewareLogLevels.debug, 'x-request-id', app).logger);

app.use(probeRoutes);
app.use("/v1", v1Router)

// app.use(AWSXRay.express.closeSegment());

app.all('*', async () => {
  throw new NotFoundError();
});

app.use(errorHandlers);

export { app, expressOasGenerator };
