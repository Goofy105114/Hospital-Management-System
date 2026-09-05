import { Redis } from '@upstash/redis';

/**
 * Upstash Redis Client Singleton
 * Used for session caching, distributed locks (concurrency-protected slot booking),
 * and rate limiting. Gracefully handles absence of credentials during local dev/testing.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (err) {
    console.warn(`[Redis] Cache miss/error for key ${key}:`, err);
    return null;
  }
}

export async function setCached(key: string, value: any, ttlSeconds = 300): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis] Cache set error for key ${key}:`, err);
  }
}
