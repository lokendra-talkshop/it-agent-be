import jwt from 'jsonwebtoken';
import { InternalError } from '../errors/internal-error';
import { TimeUtils } from '../utils/time';
import { SimpleEncrytor } from './simpleCrypto';
import { loggerInstance } from './custom-logger';

export const UserTypes = {
  user: 'user',
  admin: 'admin',
  ops: 'ops',
};

const simpleEncrytor = new SimpleEncrytor();
if (process.env.IS_TOKEN_ENCRYPTED === 'true') {
  if (!process.env.CRYPTO_KEY) {
    throw new InternalError('Crypto key not found');
  }
  simpleEncrytor.initialize(process.env.CRYPTO_KEY, true);
}

export class TokenManager {
  static isTokenEncrypted = process.env.isTokenEncrypted === 'true';

  static generateAdminJWTToken(expireIn, id, phoneNumber, countryCode, name = null, email = null) {
    if (!process.env.JWT_SECRET) {
      throw new InternalError('JWT secret not found');
    }
    const expireAt = TimeUtils.getUnixTimeStampInSecs(expireIn.minutes, expireIn.hours, expireIn.days);

    const token = {
      id,
      type: UserTypes.admin,
      name,
      email,
      phoneNumber,
      countryCode,
      iat: TimeUtils.getUnixTimeStampInSecs(),
    };

    const jwtToken = jwt.sign({ ...token, exp: expireAt }, process.env.JWT_SECRET);
    return {
      jwtToken: this.isTokenEncrypted ? simpleEncrytor.encrypt(jwtToken) : jwtToken,
      expireAt,
    };
  }

  static generateAdminRefreshToken(expireIn, id, phoneNumber, countryCode, name = null, email = null) {
    if (!process.env.REFRESH_SECRET) {
      throw new InternalError('Refresh secret not found');
    }
    const expireAt = TimeUtils.getUnixTimeStampInSecs(expireIn.minutes, expireIn.hours, expireIn.days);

    const token = {
      id,
      type: UserTypes.admin,
      name,
      email,
      phoneNumber,
      countryCode,
      iat: TimeUtils.getUnixTimeStampInSecs(),
    };

    const refreshToken = jwt.sign({ ...token, exp: expireAt }, process.env.REFRESH_SECRET);

    return {
      refreshToken: this.isTokenEncrypted ? simpleEncrytor.encrypt(refreshToken) : refreshToken,
      expireAt,
    };
  }

  static generateUserJWTToken(expireIn, id, name = null, email = null) {
    if (!process.env.JWT_SECRET) {
      throw new InternalError('JWT secret not found');
    }
    const expireAt = TimeUtils.getUnixTimeStampInSecs(expireIn.minutes, expireIn.hours, expireIn.days);

    const token = {
      id,
      type: UserTypes.user,
      name,
      email,
      iat: TimeUtils.getUnixTimeStampInSecs(),
    };

    const jwtToken = jwt.sign({ ...token, exp: expireAt }, process.env.JWT_SECRET);
    return {
      jwtToken: this.isTokenEncrypted ? simpleEncrytor.encrypt(jwtToken) : jwtToken,
      expireAt,
    };
  }

  static generateUserRefreshToken(expireIn, id, name = null , email = null) {
    if (!process.env.REFRESH_SECRET) {
      throw new InternalError('Refresh secret not found');
    }
    const expireAt = TimeUtils.getUnixTimeStampInSecs(expireIn.minutes, expireIn.hours, expireIn.days);

    const token = {
      id,
      type: UserTypes.user,
      name,
      email,
      iat: TimeUtils.getUnixTimeStampInSecs(),
    };

    const refreshToken = jwt.sign({ ...token, exp: expireAt }, process.env.REFRESH_SECRET);

    return {
      refreshToken: this.isTokenEncrypted ? simpleEncrytor.encrypt(refreshToken) : refreshToken,
      expireAt,
    };
  }

  static verifyUserJWTToken(token, options = {}) {
    try {
      if (this.isTokenEncrypted) {
        token = simpleEncrytor.decrypt(token);
      }
      if (!process.env.JWT_SECRET) {
        throw new InternalError('JWT secret not found');
      }
      return jwt.verify(token, process.env.JWT_SECRET, options);
    } catch (err) {
      loggerInstance.info(err);
      throw err;
    }
  }

  static verifyUserRefreshToken(token, options = {}) {
    try {
      if (this.isTokenEncrypted) {
        token = simpleEncrytor.decrypt(token);
      }
      if (!process.env.REFRESH_SECRET) {
        throw new InternalError('Refresh secret not found');
      }
      return jwt.verify(token, process.env.REFRESH_SECRET, options);
    } catch (err) {
      loggerInstance.info(err);
      throw err;
    }
  }
}
