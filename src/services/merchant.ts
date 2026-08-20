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
  const { rows } = await db.query(
    `SELECT
      id, store_id, shopify_variant_id, title, sku,
      listed_price, floor_price,
      inventory_available, inventory_reserved, reservation_expires_at,
      inventory_state, agent_schema, updated_at
    FROM products
    WHERE store_id = $1 AND inventory_state = 'AVAILABLE' AND inventory_available > 0`,
    [storeId]
  );

  return rows.map(mapProductRow);
}

export async function getVariant(variantId: string): Promise<Product | null> {
  const { rows } = await db.query(
    `SELECT
      id, store_id, shopify_variant_id, title, sku,
      listed_price, floor_price,
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
      listed_price, floor_price,
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
  const updates: string[] = ["inventory_state = $2", "updated_at = NOW()"];
  const params: unknown[] = [productId, newState];
  let idx = 3;

  if (options?.reservedDelta !== undefined) {
    updates.push(`inventory_reserved = inventory_reserved + $${idx}`);
    params.push(options.reservedDelta);
    idx++;
  }

  if (options?.availableDelta !== undefined) {
    updates.push(`inventory_available = inventory_available + $${idx}`);
    params.push(options.availableDelta);
    idx++;
  }

  if (options?.reservationExpiresAt !== undefined) {
    updates.push(`reservation_expires_at = $${idx}`);
    params.push(options.reservationExpiresAt);
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
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    shopifyProductId: "",
    shopifyVariantId: row.shopify_variant_id as string,
    title: row.title as string,
    sku: row.sku as string,
    listedPrice: parseFloat(row.listed_price as string),
    floorPrice: parseFloat(row.floor_price as string),
    inventoryAvailable: row.inventory_available as number,
    inventoryReserved: row.inventory_reserved as number,
    reservationExpiresAt: row.reservation_expires_at as Date | undefined,
    inventoryState: row.inventory_state as InventoryState,
    agentSchema: row.agent_schema as AgentProductSchema,
    updatedAt: row.updated_at as Date,
  };
}
