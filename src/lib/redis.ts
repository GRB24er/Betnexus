import Redis from "ioredis";

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

  const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 5) return null; // Stop retrying after 5 attempts
      return Math.min(times * 200, 5000);
    },
  });

  client.on("error", () => {
    // Silently handle connection errors; operations will fall through gracefully
  });

  client.on("close", () => {
    // Reset cached client on close so next call creates a fresh connection
    cached.client = null;
  });

  client.connect().catch(() => {});
  cached.client = client;
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
  } catch {
    // Redis unavailable — fail silently, app continues without caching
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {
    // Redis unavailable — fail silently
  }
}

export async function cacheIncr(
  key: string,
  ttlSeconds = 60
): Promise<number> {
  const redis = getRedis();
  // Use pipeline to make INCR + EXPIRE atomic
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, ttlSeconds, "NX"); // Only set TTL if not already set
  const results = await pipeline.exec();
  const count = results?.[0]?.[1];
  return typeof count === "number" ? count : 1;
}
