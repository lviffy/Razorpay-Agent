import { db } from "@zapai/database";
import { acquireLock, releaseLock } from "../integrations/redis/index";
import { randomBytes } from "crypto";

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  lockKey?: string;
  expiresAt?: string;
  error?: string;
}

const RESERVATION_TTL_SECONDS = 120;

/**
 * Reserve inventory atomically:
 * 1. Acquires distributed Redis lock (TTL 120s)
 * 2. Transactionally moves count in Postgres from `inventory_available` to `inventory_reserved`
 * 3. Sets `inventory_state` = 'RESERVED'
 */
export async function reserveInventory(params: {
  storeId: string;
  skuOrVariantId: string;
  quantity?: number;
  ttlSeconds?: number;
}): Promise<ReservationResult> {
  const quantity = params.quantity ?? 1;
  const ttl = params.ttlSeconds ?? RESERVATION_TTL_SECONDS;
  const reservationId = `res_${randomBytes(8).toString("hex")}`;
  const lockKey = `lock:inventory:${params.storeId}:${params.skuOrVariantId}`;

  // 1. Acquire distributed concurrency lock in Redis
  const locked = await acquireLock(lockKey);
  if (!locked) {
    return {
      success: false,
      error: `Could not acquire concurrency lock on item ${params.skuOrVariantId}. Item is currently locked by another buyer.`,
    };
  }

  // 2. Perform transactional database update
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Match by SKU/ID scoped to the store so the same SKU from different stores never collides
    const { rows: products } = await client.query(
      `SELECT id, sku, inventory_available, inventory_reserved
       FROM products
       WHERE store_id = $2
         AND (id::text = $1 OR sku = $1 OR shopify_variant_id = $1)
       FOR UPDATE`,
      [params.skuOrVariantId, params.storeId]
    );

    if (products.length === 0) {
      await client.query("ROLLBACK");
      await releaseLock(lockKey);
      return {
        success: false,
        error: `Product ${params.skuOrVariantId} not found`,
      };
    }

    const prod = products[0];
    if (prod.inventory_available < quantity) {
      await client.query("ROLLBACK");
      await releaseLock(lockKey);
      return {
        success: false,
        error: `Insufficient inventory: requested ${quantity}, available ${prod.inventory_available}`,
      };
    }

    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    // Deduct available, increment reserved
    await client.query(
      `UPDATE products
       SET inventory_available = inventory_available - $1,
           inventory_reserved = inventory_reserved + $1,
           inventory_state = 'RESERVED',
           reservation_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [quantity, expiresAt, prod.id]
    );

    await client.query("COMMIT");

    return {
      success: true,
      reservationId,
      lockKey,
      expiresAt,
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    await releaseLock(lockKey);
    return {
      success: false,
      error: `Database transaction error reserving inventory: ${err.message}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Commit inventory to PAID state when payment capture is verified
 */
export async function commitInventoryPaid(params: {
  storeId: string;
  skuOrVariantId: string;
  quantity?: number;
  lockKey?: string;
}): Promise<boolean> {
  const quantity = params.quantity ?? 1;

  try {
    await db.query(
      `UPDATE products
       SET inventory_reserved = GREATEST(0, inventory_reserved - $1),
           inventory_state = CASE WHEN inventory_available <= 0 THEN 'SOLD' ELSE 'AVAILABLE' END,
           reservation_expires_at = NULL,
           updated_at = NOW()
       WHERE store_id = $3
         AND (id::text = $2 OR sku = $2 OR shopify_variant_id = $2)`,
      [quantity, params.skuOrVariantId, params.storeId]
    );

    if (params.lockKey) {
      await releaseLock(params.lockKey);
    }
    return true;
  } catch (err) {
    console.error("Error committing inventory to PAID:", err);
    return false;
  }
}

/**
 * Release inventory hold on failure or timeout (reverts RESERVED -> AVAILABLE)
 */
export async function releaseInventoryReservation(params: {
  storeId: string;
  skuOrVariantId: string;
  quantity?: number;
  lockKey?: string;
}): Promise<boolean> {
  const quantity = params.quantity ?? 1;

  try {
    await db.query(
      `UPDATE products
       SET inventory_available = inventory_available + $1,
           inventory_reserved = GREATEST(0, inventory_reserved - $1),
           inventory_state = 'AVAILABLE',
           reservation_expires_at = NULL,
           updated_at = NOW()
       WHERE store_id = $3
         AND (id::text = $2 OR sku = $2 OR shopify_variant_id = $2)`,
      [quantity, params.skuOrVariantId, params.storeId]
    );

    if (params.lockKey) {
      await releaseLock(params.lockKey);
    }
    return true;
  } catch (err) {
    console.error("Error releasing inventory reservation:", err);
    return false;
  }
}
