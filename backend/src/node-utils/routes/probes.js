import express from 'express';
import { DynamoDbReader } from '../../services/dynamoDB-manager';
import { NotImplementedError } from '../errors/not-implemented-error';
import { loggerInstance } from '../services/custom-logger';

const router = express.Router();

router.get('/healthy', (req, res) => {
  res.status(200).send('Ok');
});

router.get('/ready', (req, res) => {
  res.status(200).send('Ok');
});

router.get('/availableCountries', async (req, res) => {
  const dynamo = new DynamoDbReader('us-east-2', 'AppConfigTable');
  const key = {};
  if (process.env.ENVIRONMENT.startsWith('dev')) {
    key.appid = 'role-play-bot-dev';
  } else if (process.env.ENVIRONMENT.startsWith('prod')) {
    key.appid = 'role-play-bot-prod';
  } else {
    throw new NotImplementedError('Environment not implemented');
  }
  const result = await dynamo.getItem(key);
  loggerInstance.info(result);
  res.status(200).json({ countryCodes: result.availableCountries[0] });
});

router.get('/version', async (req, res) => {
  const dynamo = new DynamoDbReader('us-east-2', 'AppVersionControl');
  const key = {};
  if (process.env.ENVIRONMENT.startsWith('dev')) {
    key.appid = 'role-play-bot-dev';
  } else if (process.env.ENVIRONMENT.startsWith('prod')) {
    key.appid = 'role-play-bot-prod';
  } else {
    throw new NotImplementedError('Environment not implemented');
  }
  const result = await dynamo.getItem(key);
  loggerInstance.info(result);
  res.status(200).json(result);
});

export { router as probeRoutes };
