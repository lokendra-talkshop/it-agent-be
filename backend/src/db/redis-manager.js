import { RedisClient } from '../node-utils';

export const redis = new RedisClient();

const setKey = async (key, value) => await redis.client.set(key, value);

const setFeedLock = async (userId) => await setKeyAndExpire(`feed_${userId}`, '1', 60);

const deleteFeedLock = async (userId) => await deleteKey(`feed_${userId}`);

const getFeedLock = async (userId) => await getKey(`feed_${userId}`);

const setKeyAndExpire = async (key, value, expireSecs) => {
  await setKey(key, value);
  return redis.client.expire(key, expireSecs);
};

const getKey = async (key) => {
  const exists = await redis.client.exists(key);
  if (!exists) return null;
  return redis.client.get(key);
};

const deleteKey = async (key) => await redis.client.del(key);

const getHash = async (key) => {
  const exists = await redis.client.exists(key);
  if (!exists) return null;
  return redis.client.hgetall(key);
};

const setHash = async (key, value) => await redis.client.hmset(key, value);

const getTTL = async (key) => await redis.client.ttl(key);

const setHashAndExpire = async (key, value, expireSecs) => {
  await setHash(key, value);
  return redis.client.expire(key, expireSecs);
};

const cacheApiResponse = async (key, value, expireSecs) => {
  const serializedValue = JSON.stringify(value);
  return setKeyAndExpire(key, serializedValue, expireSecs);
};

const getCachedApiResponse = async (key) => {
  const serializedValue = await getKey(key);
  return serializedValue ? JSON.parse(serializedValue) : null;
};

export default {
  setKey,
  setKeyAndExpire,
  getKey,
  deleteKey,
  getHash,
  setHash,
  setHashAndExpire,
  getTTL,
  setFeedLock,
  deleteFeedLock,
  getFeedLock,
  cacheApiResponse,
  getCachedApiResponse,
};
