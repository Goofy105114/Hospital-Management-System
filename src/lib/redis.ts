import { Redis } from "@upstash/redis";

// In-memory fallback cache when Upstash credentials are not set
class InMemoryCache {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<"OK"> {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : null;
    this.store.set(key, { value: stringValue, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const item = await this.get<number>(key);
    const newVal = (item || 0) + 1;
    await this.set(key, newVal);
    return newVal;
  }
}

const memoryFallback = new InMemoryCache();

const isUpstashConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : (memoryFallback as unknown as Redis);

/**
 * Acquire a distributed lock for concurrency-critical operations (APT-03, QUE-02, PHA-04)
 */
export async function acquireLock(lockKey: string, ttlSeconds = 5): Promise<boolean> {
  const key = `lock:${lockKey}`;
  const now = Date.now().toString();
  try {
    if (isUpstashConfigured) {
      const res = await (redis as Redis).set(key, now, { nx: true, ex: ttlSeconds });
      return res === "OK";
    } else {
      const exists = await memoryFallback.get(key);
      if (exists) return false;
      await memoryFallback.set(key, now, { ex: ttlSeconds });
      return true;
    }
  } catch {
    return true; // Fallback to allowing execution if redis fails
  }
}

export async function releaseLock(lockKey: string): Promise<void> {
  const key = `lock:${lockKey}`;
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
}
