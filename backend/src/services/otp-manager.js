import { loggerInstance } from '../node-utils';
import redisClient from '../db/redis-manager';
import appConfig from '../configs';
import { twilioService } from './twilio';

const createRedisKey = async (countryCode, phoneNumber, isAdmin = false) =>
  isAdmin ? `adminOtp:${countryCode}:${phoneNumber}` : `otp:${countryCode}:${phoneNumber}`;

const createRedisOTPObject = (otp, isRetry, previousSentCount = 0) => ({
  otp,
  isRetry: isRetry.toString(),
  previousSentCount: previousSentCount.toString(),
});

const parseRedisOTPObject = (redisObject) => ({
  otp: redisObject.otp,
  isRetry: redisObject.isRetry === 'true',
  previousSentCount: parseInt(redisObject.previousSentCount, 10),
});

const createOTP = (length = 4) => {
  let otp = Math.floor(Math.random() * 10 ** length).toString();
  otp = otp.padStart(length, '0');
  return otp;
};

const constructOTPMessage = async (otp, isAdmin = false) =>
  isAdmin ? `Your OTP to login into the dashboard is ${otp}` : `Your OTP is ${otp}`;

const isDevUser = (countryCode, phoneNumber) => {
  loggerInstance.info(phoneNumber.length);
  loggerInstance.info(process.env.ENVIRONMENT);
  return process.env.ENVIRONMENT.startsWith('dev') && phoneNumber.length > 10;
};

function isLocalEnvironment() {
  return process.env.ENVIRONMENT === 'local';
}

const isApple = (countryCode, phoneNumber) => {
  if (phoneNumber === '1111111111') {
    return true;
  }
  return false;
};

const sendOTP = async (countryCode, phoneNumber) => {
  if (isLocalEnvironment()) {
    return true;
  }

  const redisKey = await createRedisKey(countryCode, phoneNumber);
  const [_redisObject, ttl] = await Promise.all([
    // let [_redisObject] = await Promise.all([
    redisClient.getHash(redisKey),
    redisClient.getTTL(redisKey),
  ]);
  const redisObject = _redisObject ? parseRedisOTPObject(_redisObject) : null;
  if (
    redisObject &&
    redisObject.isRetry &&
    redisObject.previousSentCount >= 3 // TODO Move this to config
  ) {
    loggerInstance.error('OTP retry limit exceeded');
    // TODO Do something about it
    return false;
  }

  const otp = redisObject ? redisObject.otp : createOTP();
  const otpMessage = await constructOTPMessage(otp);
  loggerInstance.info(otpMessage);

  try {
    if (!isApple(countryCode, phoneNumber) && !isDevUser(countryCode, phoneNumber)) {
      await twilioService.sendMessage(`${countryCode}${phoneNumber}`, otpMessage, countryCode);
    }
  } catch (e) {
    loggerInstance.info(e);
    return false;
  }

  await redisClient.setHashAndExpire(
    redisKey,
    createRedisOTPObject(otp, !!redisObject, redisObject ? redisObject.previousSentCount + 1 : 1),
    ttl && ttl > 0 ? ttl : 300, // TODO Move this to config
  );
  return true;
};

const validateOTP = async (countryCode, phoneNumber, otp) => {
  if (isLocalEnvironment()) {
    return true;
  }

  const redisKey = await createRedisKey(countryCode, phoneNumber);
  const redisObject = await redisClient.getHash(redisKey);
  if (!redisObject) {
    loggerInstance.error('OTP not found in redis');
    return false;
  }
  if (otp === appConfig.apple_otp_code && (isDevUser(countryCode, phoneNumber) || isApple(countryCode, phoneNumber))) {
    return true;
  }

  const parsedRedisObject = parseRedisOTPObject(redisObject);
  if (parsedRedisObject.otp !== otp) {
    loggerInstance.error('OTP mismatch');
    return false;
  }
  return true;
};

const sendAdminOTP = async (countryCode, phoneNumber) => {
  if (isLocalEnvironment()) {
    return true;
  }

  const redisKey = await createRedisKey(countryCode, phoneNumber, true);
  const [_redisObject, ttl] = await Promise.all([redisClient.getHash(redisKey), redisClient.getTTL(redisKey)]);
  const redisObject = _redisObject ? parseRedisOTPObject(_redisObject) : null;
  if (
    redisObject &&
    redisObject.isRetry &&
    redisObject.previousSentCount >= 3 // TODO Move this to config
  ) {
    loggerInstance.error('OTP retry limit exceeded');
    // TODO Do something about it
    return false;
  }

  const otp = redisObject ? redisObject.otp : createOTP();
  const otpMessage = await constructOTPMessage(otp, true);
  loggerInstance.info(otpMessage);

  try {
    await twilioService.sendMessage(`${countryCode}${phoneNumber}`, otpMessage, countryCode);
  } catch (e) {
    loggerInstance.info(e);
    return false;
  }

  await redisClient.setHashAndExpire(
    redisKey,
    createRedisOTPObject(otp, !!redisObject, redisObject ? redisObject.previousSentCount + 1 : 1),
    ttl && ttl > 0 ? ttl : 300, // TODO Move this to config
  );
  return true;
};

const validateAdminOTP = async (countryCode, phoneNumber, otp) => {
  if (isLocalEnvironment()) {
    return true;
  }

  const redisKey = await createRedisKey(countryCode, phoneNumber, true);
  const redisObject = await redisClient.getHash(redisKey);
  loggerInstance.info('Running');
  loggerInstance.info(otp);
  loggerInstance.info(appConfig.apple_otp_code);

  if (!redisObject) {
    loggerInstance.error('OTP not found in redis');
    return false;
  }
  // Hack for apple user

  const parsedRedisObject = parseRedisOTPObject(redisObject);
  if (parsedRedisObject.otp !== otp) {
    loggerInstance.error('OTP mismatch');
    return false;
  }

  return true;
};

export default { sendOTP, validateOTP, sendAdminOTP, validateAdminOTP };
