import Redis from "ioredis";

// ─────────────────────────────────────────────────────────────────────────────
// Redis client & Graceful In-Memory Fallback
// ─────────────────────────────────────────────────────────────────────────────

let isRedisConnected = false;
const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;

if (redisUrl && redisUrl.trim()) {
  try {
    redisClient = new Redis(redisUrl.trim(), {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying if Redis is permanently unavailable
        }
        return Math.min(times * 1000, 5000);
      },
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log("✅ Redis connected successfully");
    }).catch((err) => {
      isRedisConnected = false;
      console.warn("⚠️ Could not connect to Redis, operating in resilient in-memory mode:", err.message);
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", () => {
      isRedisConnected = false;
    });
  } catch (initErr) {
    console.warn("⚠️ Redis initialization error, using in-memory mode:", initErr);
  }
} else {
  console.log("ℹ️ Running with built-in in-memory lock & queue (REDIS_URL not set)");
}

export const redis = redisClient;

// ── In-Memory Fallback Stores ────────────────────────────────────────────────
const memLocks = new Map<string, number>();
const memQueue: any[] = [];

// ── Inventory Locking (SET NX EX 120) ────────────────────────────────────────
const LOCK_TTL_SECONDS = 120;

export function lockKey(storeId: string, variantId: string): string {
  return `lock:inventory:${storeId}:${variantId}`;
}

export async function acquireLock(
  storeId: string,
  variantId: string
): Promise<boolean> {
  const key = lockKey(storeId, variantId);

  if (isRedisConnected && redisClient) {
    try {
      const result = await redisClient.set(key, "1", "EX", LOCK_TTL_SECONDS, "NX");
      return result === "OK";
    } catch {
      // Fall through to in-memory lock
    }
  }

  // In-memory atomic fallback lock
  const now = Date.now();
  const existingExpiry = memLocks.get(key);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }
  memLocks.set(key, now + LOCK_TTL_SECONDS * 1000);
  return true;
}

export async function releaseLock(
  storeId: string,
  variantId: string
): Promise<void> {
  const key = lockKey(storeId, variantId);

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch {
      // Ignore
    }
  }
  memLocks.delete(key);
}

// ── Job Queue (WhatsApp Worker) ───────────────────────────────────────────────
const WA_QUEUE = "queue:whatsapp";

export async function enqueueJob(payload: unknown): Promise<void> {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.lpush(WA_QUEUE, JSON.stringify(payload));
      return;
    } catch {
      // Fall through to in-memory queue
    }
  }
  memQueue.push(payload);
}

export async function dequeueJob(
  timeoutSeconds: number = 5
): Promise<unknown | null> {
  if (isRedisConnected && redisClient) {
    try {
      const result = await redisClient.brpop(WA_QUEUE, timeoutSeconds);
      if (result) {
        return JSON.parse(result[1]);
      }
    } catch {
      // Fall through to in-memory queue
    }
  }

  if (memQueue.length > 0) {
    return memQueue.shift();
  }

  // Wait briefly if in-memory queue is empty
  await new Promise((r) => setTimeout(r, Math.min(timeoutSeconds * 1000, 1500)));
  return memQueue.shift() || null;
}
