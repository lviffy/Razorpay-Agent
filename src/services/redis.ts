import Redis from "ioredis";

// ─────────────────────────────────────────────────────────────────────────────
// Redis client — used for inventory locking and WhatsApp job queue
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// ── Inventory Locking (SET NX EX 120) ────────────────────────────────────────
// Postgres is source of truth. Redis is a temporary atomic concurrency lock only.

const LOCK_TTL_SECONDS = 120;

export function lockKey(storeId: string, variantId: string): string {
  return `lock:inventory:${storeId}:${variantId}`;
}

/**
 * Acquire an inventory lock atomically.
 * Returns true if lock acquired, false if another buyer holds it.
 */
export async function acquireLock(
  storeId: string,
  variantId: string
): Promise<boolean> {
  const key = lockKey(storeId, variantId);
  const result = await redis.set(key, "1", "EX", LOCK_TTL_SECONDS, "NX");
  return result === "OK";
}

/**
 * Release the inventory lock explicitly.
 * (Redis TTL also auto-releases it after 120s on any failure.)
 */
export async function releaseLock(
  storeId: string,
  variantId: string
): Promise<void> {
  await redis.del(lockKey(storeId, variantId));
}

// ── Job Queue (WhatsApp Worker) ───────────────────────────────────────────────

const WA_QUEUE = "queue:whatsapp";

export async function enqueueJob(payload: unknown): Promise<void> {
  await redis.lpush(WA_QUEUE, JSON.stringify(payload));
}

/**
 * Block-pop a job from the queue.
 * Returns null if timeout reached with no job.
 */
export async function dequeueJob(
  timeoutSeconds: number = 5
): Promise<unknown | null> {
  const result = await redis.brpop(WA_QUEUE, timeoutSeconds);
  if (!result) return null;
  return JSON.parse(result[1]);
}
