import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export const getFromCache = (key: string) => {
  return cache.get(key);
};

export const setInCache = (key: string, value: unknown, ttl?: number) => {
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
};

export default cache;
