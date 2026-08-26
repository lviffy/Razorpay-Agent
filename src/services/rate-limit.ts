import { redis } from "./redis.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Buyer Velocity Limiter — Fraud Defense
// Limits a buyer (phone number) to MAX_ATTEMPTS transactions in WINDOW_SECONDS.
// Uses Redis INCR + EXPIRE for atomic counting.
// Falls back gracefully to allow-all if Redis is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

const WINDOW_SECONDS = 300; // 5-minute rolling window
const MAX_ATTEMPTS = 50;    // max transactions per window for testing/demo robustness

// In-memory fallback when Redis is down
const memStore = new Map<string, { count: number; resetAt: number }>();

export async function checkBuyerVelocity(
  identifier: string // phone number or buyerAgentId
): Promise<{ allowed: boolean; remaining: number; resetInSeconds?: number }> {
  const key = `velocity:buyer:${identifier}`;

  // ── Redis path ────────────────────────────────────────────────────────────
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        // First hit — set expiry for the window
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
      // Redis error — fall through to in-memory
    }
  }

  // ── In-memory fallback ────────────────────────────────────────────────────
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

/** Reset velocity for a specific identifier (used in tests / admin reset) */
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
