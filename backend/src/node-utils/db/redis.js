import Redis from 'ioredis';
import { InternalError } from '../errors/internal-error';
import { loggerInstance } from '../services/custom-logger';
import { delay } from '../utils/time';

export class RedisClient {
  _client = null;

  isConnectionReady = false;

  get status() {
    return this.client.status;
  }

  get client() {
    if (this._client) {
      return this._client;
    }
    throw new InternalError('Connection not initialized');
  }

  updateConnectionStatus() {
    this.isConnectionReady = this.status === 'ready';
  }

  async createConnection(host, port = 6379, options = {}) {
    loggerInstance.info(host);
    this._client = new Redis({
      ...options,
      host,
      port,
      enableReadyCheck: true,
    });
    ['connect', 'ready', 'error', 'close', 'reconnecting', 'end', 'wait'].forEach((event) => {
      this.client.on(event, this.updateConnectionStatus);
    });
    loggerInstance.info('Init Redis Client');
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise(async (resolve) => {
      while (!this.isConnectionReady) {
        await delay();
        this.updateConnectionStatus();
        if (this.isConnectionReady) resolve(this._client);
      }
    });
    await promise;
    loggerInstance.info('Connected to Redis');
    return this._client;
  }
}
