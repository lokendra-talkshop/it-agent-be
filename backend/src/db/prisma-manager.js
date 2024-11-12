import { PrismaClient } from '@prisma/client';
import appConfig from '../configs';
import { loggerInstance } from '../node-utils';

class PrismaManager {
  _readClient;

  _writeClient;

  get readClient() {
    if (!this._readClient) {
      this._readClient = new PrismaClient();
    }
    return this._readClient;
  }

  get writeClient() {
    if (!this._writeClient) {
      this._writeClient = new PrismaClient();
    }
    return this._writeClient;
  }

  async disconnect() {
    if (this._readClient) {
      await this._readClient.$disconnect();
    }
    if (this._writeClient) {
      await this._writeClient.$disconnect();
    }
    loggerInstance.info('POSTGRES DISCONNECTED');
  }

  async connect(
    readURL = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_READ_URL}:5432/${process.env.POSTGRES_DB}`,
    // process.env.POSTGRES_READ_URL!,
    writeURL = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_WRITE_URL}:5432/${process.env.POSTGRES_DB}`,
    // process.env.POSTGRES_WRITE_URL!,
    logLevel = appConfig.env === 'prod' ? 'warn' : 'query',
  ) {
    this._readClient = new PrismaClient({
      datasources: {
        db: {
          url: readURL,
        },
      },
      log: [
        {
          emit: 'event',
          level: logLevel,
        },
      ],
    });

    this._readClient.$on('query', (e) => {
      loggerInstance.info({
        type: 'DB read query',
        query: decodeURIComponent(e.query),
        params: JSON.parse(e.params),
        duration: `${e.duration}ms`,
      });
    });

    this._writeClient = new PrismaClient({
      datasources: {
        db: {
          url: writeURL,
        },
      },
      log: [
        {
          emit: 'event',
          level: logLevel,
        },
      ],
    });

    this._writeClient.$on('query', (e) => {
      loggerInstance.info({
        type: 'DB write query',
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });

    await this._readClient.$connect();
    loggerInstance.info('Read client connected to database.');
    await this._writeClient.$connect();
    loggerInstance.info('Write client connected to database.');
  }
}

export const prisma = new PrismaManager();
