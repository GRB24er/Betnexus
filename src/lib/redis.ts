import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

type RedisCache = {
  client: Redis | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _redisCache: RedisCache | undefined;
}

const cached: RedisCache = global._redisCache ?? { client: null };
if (!global._redisCache) {
  global._redisCache = cached;
}

export function getRedis(): Redis {
  if (cached.client) return cached.client;
  cached.client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  });
  cached.client.connect().catch(() => {});
  return cached.client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await getRedis().get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {}
}

export async function cacheIncr(
  key: string,
  ttlSeconds = 60
): Promise<number> {
  const redis = getRedis();
  const val = await redis.incr(key);
  if (val === 1) await redis.expire(key, ttlSeconds);
  return val;
}
