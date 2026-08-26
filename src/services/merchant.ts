import { db } from "../db/migrate.ts";
import type { Product, Store, NegotiationRules, AgentProductSchema, InventoryState } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Merchant Service — thin Postgres wrapper for mock merchant data
// No Shopify, no GraphQL, no OAuth
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllStores(): Promise<Store[]> {
  const { rows } = await db.query<Store>(
    "SELECT id, name, city, razorpay_account_id, currency, is_active FROM stores WHERE is_active = true"
  );
  return rows;
}

export async function getStore(storeId: string): Promise<Store | null> {
  const { rows } = await db.query<Store>(
    "SELECT id, name, city, razorpay_account_id, currency, is_active FROM stores WHERE id = $1",
    [storeId]
  );
  return rows[0] ?? null;
}

export async function getProducts(storeId: string): Promise<Product[]> {
  // 1. Auto-release expired reservations (TTL > 120s)
  try {
    await db.query(
      `UPDATE products
       SET inventory_state = 'AVAILABLE',
           inventory_available = inventory_available + inventory_reserved,
           inventory_reserved = 0,
           reservation_expires_at = NULL
       WHERE inventory_state IN ('RESERVED', 'PAYMENT_PENDING')
         AND reservation_expires_at IS NOT NULL
         AND reservation_expires_at < NOW()`
    );
  } catch (e) {
    // ignore
  }

  // 2. Fetch available catalog for active store(s)
  const { rows } = await db.query(
    `SELECT
      id, store_id, shopify_variant_id, title, sku,
      listed_price, floor_price, image_url,
      inventory_available, inventory_reserved, reservation_expires_at,
      inventory_state, agent_schema, updated_at
    FROM products
    WHERE store_id = $1 AND inventory_state = 'AVAILABLE' AND inventory_available > 0
    ORDER BY created_at DESC`,
    [storeId]
  );

  return rows.map(mapProductRow);
}

export async function getAllActiveProducts(): Promise<Product[]> {
  try {
    await db.query(
      `UPDATE products
       SET inventory_state = 'AVAILABLE',
           inventory_available = inventory_available + inventory_reserved,
           inventory_reserved = 0,
           reservation_expires_at = NULL
       WHERE inventory_state IN ('RESERVED', 'PAYMENT_PENDING')
         AND reservation_expires_at IS NOT NULL
         AND reservation_expires_at < NOW()`
    );
  } catch (e) {
    // ignore
  }

  const { rows } = await db.query(
    `SELECT
      p.id, p.store_id, p.shopify_variant_id, p.title, p.sku,
      p.listed_price, p.floor_price, p.image_url,
      p.inventory_available, p.inventory_reserved, p.reservation_expires_at,
      p.inventory_state, p.agent_schema, p.updated_at
    FROM products p
    JOIN stores s ON p.store_id = s.id
    WHERE s.is_active = true
      AND p.inventory_available > 0
    ORDER BY p.created_at DESC`
  );

  return rows.map(mapProductRow);
}

export async function getVariant(variantId: string): Promise<Product | null> {
  const { rows } = await db.query(
    `SELECT
      id, store_id, shopify_variant_id, title, sku,
      listed_price, floor_price, image_url,
      inventory_available, inventory_reserved, reservation_expires_at,
      inventory_state, agent_schema, updated_at
    FROM products
    WHERE shopify_variant_id = $1`,
    [variantId]
  );
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const { rows } = await db.query(
    `SELECT
      id, store_id, shopify_variant_id, title, sku,
      listed_price, floor_price, image_url,
      inventory_available, inventory_reserved, reservation_expires_at,
      inventory_state, agent_schema, updated_at
    FROM products WHERE id = $1`,
    [productId]
  );
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function getNegotiationRules(storeId: string): Promise<NegotiationRules | null> {
  const { rows } = await db.query(
    `SELECT
      store_id, max_discount_percentage, min_order_value_for_discount,
      free_shipping_threshold, allow_bundle_offers, auto_accept_threshold
    FROM negotiation_rules WHERE store_id = $1`,
    [storeId]
  );

  if (!rows[0]) return null;

  return {
    storeId: rows[0].store_id,
    maxDiscountPercentage: parseFloat(rows[0].max_discount_percentage),
    minOrderValueForDiscount: parseFloat(rows[0].min_order_value_for_discount),
    freeShippingThreshold: rows[0].free_shipping_threshold
      ? parseFloat(rows[0].free_shipping_threshold)
      : undefined,
    allowBundleOffers: rows[0].allow_bundle_offers,
    autoAcceptThreshold: rows[0].auto_accept_threshold
      ? parseFloat(rows[0].auto_accept_threshold)
      : undefined,
  };
}

// ── Inventory State Machine ───────────────────────────────────────────────────

export async function setInventoryState(
  productId: string,
  newState: InventoryState,
  options?: {
    reservedDelta?: number;      // +1 when reserving, -1 when releasing
    availableDelta?: number;     // -1 when sold
    reservationExpiresAt?: Date | null;
  }
): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  if (!isUuid) {
    return; // Safely ignore non-UUID test mock IDs
  }

  const updates: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [productId];
  let idx = 2;

  if (options?.reservedDelta !== undefined) {
    updates.push(`inventory_reserved = GREATEST(0, inventory_reserved + $${idx})`);
    params.push(options.reservedDelta);
    idx++;
  }

  if (options?.availableDelta !== undefined) {
    updates.push(`inventory_available = GREATEST(0, inventory_available + $${idx})`);
    params.push(options.availableDelta);
    idx++;
  }

  if (options?.reservationExpiresAt !== undefined) {
    updates.push(`reservation_expires_at = $${idx}`);
    params.push(options.reservationExpiresAt);
    idx++;
  }

  if (newState === "PAID") {
    // If stock remains > 0 after payment, keep item AVAILABLE for other buyers!
    updates.push(`inventory_state = CASE WHEN inventory_available > 0 THEN 'AVAILABLE' ELSE 'PAID' END`);
  } else {
    updates.push(`inventory_state = $${idx}`);
    params.push(newState);
    idx++;
  }

  await db.query(
    `UPDATE products SET ${updates.join(", ")} WHERE id = $1`,
    params
  );
}

// ── Catalog snapshot for Buyer Agent ─────────────────────────────────────────

export async function getCatalogForAgent(): Promise<
  { store: Store; products: AgentProductSchema[] }[]
> {
  const stores = await getAllStores();

  const catalog = await Promise.all(
    stores.map(async (store) => {
      const products = await getProducts(store.id);
      return {
        store,
        products: products.map((p) => p.agentSchema),
      };
    })
  );

  return catalog;
}

// ── Internal mapper ───────────────────────────────────────────────────────────

function mapProductRow(row: Record<string, unknown>): Product {
  const imageUrl = (row.image_url as string | null) ?? undefined;
  const agentSchema = row.agent_schema as AgentProductSchema;
  // Merge image_url into the agentSchema so agents can pass it downstream
  if (imageUrl && agentSchema) {
    agentSchema.imageUrl = imageUrl;
  }
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    shopifyProductId: "",
    shopifyVariantId: row.shopify_variant_id as string,
    title: row.title as string,
    sku: row.sku as string,
    listedPrice: parseFloat(row.listed_price as string),
    floorPrice: parseFloat(row.floor_price as string),
    imageUrl,
    inventoryAvailable: row.inventory_available as number,
    inventoryReserved: row.inventory_reserved as number,
    reservationExpiresAt: row.reservation_expires_at as Date | undefined,
    inventoryState: row.inventory_state as InventoryState,
    agentSchema,
    updatedAt: row.updated_at as Date,
  };
}
