import crypto from 'crypto';
import { InternalError } from '../errors/internal-error';
import { NotAuthorizedError } from '../errors/not-authorized-error';
import { CustomError } from '../errors/custom-error';
import { loggerInstance } from './custom-logger';

const scmp = require('scmp');

export class SimpleEncrytor {
  cryptoKey = null;

  verifyHmac = true;

  initialize(cryptoKey, verifyHmac) {
    if (!cryptoKey || typeof cryptoKey !== 'string' || cryptoKey.length < 16)
      throw new InternalError('Key of min length 16 is required.');

    // * Hash digest using 'SHA256'
    this.cryptoKey = crypto.createHash('sha256').update(cryptoKey).digest();
    this.verifyHmac = verifyHmac;
  }

  createHmac(s) {
    if (!this.cryptoKey) throw new InternalError('Crypto key not initialized');
    return crypto.createHmac('sha256', this.cryptoKey).update(s).digest('hex');
  }

  encrypt(toEncrypt) {
    if (!this.cryptoKey) throw new InternalError('Crypto key not initialized');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', this.cryptoKey, iv);
    const encrypted = cipher.update(toEncrypt, 'utf8', 'base64') + cipher.final('base64');
    const ivAttachedEncrypted = iv.toString('hex') + encrypted;
    if (this.verifyHmac) return this.createHmac(ivAttachedEncrypted) + ivAttachedEncrypted;
    return ivAttachedEncrypted;
  }

  decrypt(_toDecrypt) {
    if (!this.cryptoKey) throw new InternalError('Crypto key not initialized');
    if (!_toDecrypt) throw new NotAuthorizedError();
    try {
      let toDecrypt;
      if (this.verifyHmac) {
        const expectedHmac = _toDecrypt.substring(0, 64);
        toDecrypt = _toDecrypt.substring(64);
        const actualHmac = this.createHmac(toDecrypt);
        if (!scmp(Buffer.from(actualHmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
          throw new NotAuthorizedError();
        }
      } else {
        toDecrypt = _toDecrypt;
      }

      const iv = Buffer.from(toDecrypt.substring(0, 32), 'hex');
      toDecrypt = toDecrypt.substring(32);

      const decipher = crypto.createDecipheriv('aes-256-cbc', this.cryptoKey, iv);

      const decrypted = decipher.update(toDecrypt, 'base64', 'utf8') + decipher.final('utf8');
      return decrypted;
    } catch (err) {
      if (err instanceof CustomError) throw err;
      else {
        loggerInstance.info(`Unauthorized access. Token string: ${_toDecrypt}`, err);
        throw new NotAuthorizedError();
      }
    }
  }
}
