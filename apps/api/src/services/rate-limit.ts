import { redis } from "../integrations/redis/index.ts";

const WINDOW_SECONDS = 300;
const MAX_ATTEMPTS = 50;

const memStore = new Map<string, { count: number; resetAt: number }>();

export async function checkBuyerVelocity(
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetInSeconds?: number }> {
  const key = `velocity:buyer:${identifier}`;

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
      }

      const ttl = await redis.ttl(key);
      const allowed = count <= MAX_ATTEMPTS;
      return {
        allowed,
        remaining: Math.max(0, MAX_ATTEMPTS - count),
        resetInSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
      };
    } catch {
      // Fall through to in-memory
    }
  }

  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInSeconds: WINDOW_SECONDS };
  }

  entry.count += 1;
  const allowed = entry.count <= MAX_ATTEMPTS;
  return {
    allowed,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export async function resetBuyerVelocity(identifier: string): Promise<void> {
  const key = `velocity:buyer:${identifier}`;
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
  memStore.delete(key);
}
