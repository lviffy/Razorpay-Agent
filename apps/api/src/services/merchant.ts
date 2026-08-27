import { db } from "@zapai/database";
import type { Product, Store, NegotiationRules, AgentProductSchema, InventoryState } from "@zapai/types";

function mapProductRow(row: Record<string, unknown>): Product {
  const imageUrl = (row.image_url as string | null) ?? undefined;
  const agentSchema = typeof row.agent_schema === "string" ? JSON.parse(row.agent_schema) : (row.agent_schema as AgentProductSchema);
  if (imageUrl && agentSchema) {
    agentSchema.imageUrl = imageUrl;
  }
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    shopifyProductId: (row.shopify_product_id as string) || "",
    shopifyVariantId: (row.shopify_variant_id as string) || "",
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

export async function getAllStores(): Promise<Store[]> {
  const { rows } = await db.query<Store>(
    "SELECT id, name, city, razorpay_account_id, currency, is_active FROM stores WHERE is_active = true"
  );
  return rows;
}

export async function getStore(storeId: string): Promise<Store | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
  const { rows } = isUuid
    ? await db.query<Store>(
        "SELECT id, name, city, razorpay_account_id, currency, is_active FROM stores WHERE id = $1",
        [storeId]
      )
    : await db.query<Store>(
        "SELECT id, name, city, razorpay_account_id, currency, is_active FROM stores LIMIT 1"
      );
  return rows[0] ?? null;
}

export function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  const unique: Product[] = [];
  for (const p of products) {
    const key = `${p.title.trim().toLowerCase()}_${(p.sku || "").trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }
  return unique;
}

export async function getProducts(storeId: string): Promise<Product[]> {
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

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
  const { rows } = isUuid
    ? await db.query(
        `SELECT
          id, store_id, shopify_variant_id, title, sku,
          listed_price, floor_price, image_url,
          inventory_available, inventory_reserved, reservation_expires_at,
          inventory_state, agent_schema, updated_at
        FROM products
        WHERE store_id = $1 AND inventory_available > 0
        ORDER BY created_at DESC`,
        [storeId]
      )
    : await db.query(
        `SELECT
          id, store_id, shopify_variant_id, title, sku,
          listed_price, floor_price, image_url,
          inventory_available, inventory_reserved, reservation_expires_at,
          inventory_state, agent_schema, updated_at
        FROM products
        WHERE inventory_available > 0
        ORDER BY created_at DESC`
      );

  return deduplicateProducts(rows.map(mapProductRow));
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

  return deduplicateProducts(rows.map(mapProductRow));
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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  const { rows } = isUuid
    ? await db.query(
        `SELECT
          id, store_id, shopify_variant_id, title, sku,
          listed_price, floor_price, image_url,
          inventory_available, inventory_reserved, reservation_expires_at,
          inventory_state, agent_schema, updated_at
        FROM products
        WHERE id = $1`,
        [productId]
      )
    : await db.query(
        `SELECT
          id, store_id, shopify_variant_id, title, sku,
          listed_price, floor_price, image_url,
          inventory_available, inventory_reserved, reservation_expires_at,
          inventory_state, agent_schema, updated_at
        FROM products
        WHERE shopify_variant_id = $1 OR shopify_product_id = $1 LIMIT 1`,
        [productId]
      );

  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function getProduct(productId: string): Promise<Product | null> {
  return getProductById(productId);
}

export async function getCatalogForAgent(): Promise<
  { store: Store; products: AgentProductSchema[] }[]
> {
  const stores = await getAllStores();

  const catalog = await Promise.all(
    stores.map(async (store) => {
      const products = await getProducts(store.id);
      return {
        store,
        products: products.map((p) => p.agentSchema || {
          variantId: p.shopifyVariantId || p.id,
          title: p.title,
          sku: p.sku,
          listedPrice: p.listedPrice || p.price || 0,
          floorPrice: p.floorPrice || p.minPrice || 0,
          inventoryAvailable: p.inventoryAvailable || 10,
          attributes: {},
        }),
      };
    })
  );

  return catalog;
}

export async function getNegotiationRules(storeId: string): Promise<NegotiationRules> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
  const { rows } = isUuid
    ? await db.query(
        "SELECT * FROM negotiation_rules WHERE store_id = $1",
        [storeId]
      )
    : await db.query("SELECT * FROM negotiation_rules LIMIT 1");

  const r = rows[0];
  if (!r) {
    return {
      storeId,
      maxDiscountPercentage: 15,
      minOrderValueForDiscount: 1000,
      freeShippingThreshold: 4000,
      allowBundleOffers: true,
    };
  }

  return {
    storeId: r.store_id,
    maxDiscountPercentage: parseFloat(r.max_discount_percentage),
    minOrderValueForDiscount: parseFloat(r.min_order_value_for_discount),
    freeShippingThreshold: r.free_shipping_threshold ? parseFloat(r.free_shipping_threshold) : undefined,
    allowBundleOffers: r.allow_bundle_offers,
    autoAcceptThreshold: r.auto_accept_threshold ? parseFloat(r.auto_accept_threshold) : undefined,
  };
}

export async function reserveInventory(
  productId: string,
  ttlSeconds = 120
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  const idCol = isUuid ? "id" : "shopify_variant_id";

  const { rowCount } = await db.query(
    `UPDATE products
     SET inventory_state = 'RESERVED',
         inventory_available = inventory_available - 1,
         inventory_reserved = inventory_reserved + 1,
         reservation_expires_at = $1,
         updated_at = NOW()
     WHERE ${idCol} = $2
       AND inventory_available > 0
       AND (inventory_state = 'AVAILABLE' OR (inventory_state = 'RESERVED' AND reservation_expires_at < NOW()))`,
    [expiresAt, productId]
  );

  return (rowCount ?? 0) > 0;
}

export async function setInventoryState(
  productId: string,
  state: InventoryState,
  options?: { reservedDelta?: number; clearExpiry?: boolean }
): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
  const idCol = isUuid ? "id" : "shopify_variant_id";
  const delta = options?.reservedDelta ?? 0;

  await db.query(
    `UPDATE products
     SET inventory_state = $1,
         inventory_reserved = GREATEST(0, inventory_reserved + $2),
         reservation_expires_at = CASE WHEN $3 = true THEN NULL ELSE reservation_expires_at END,
         updated_at = NOW()
     WHERE ${idCol} = $4`,
    [state, delta, options?.clearExpiry ?? false, productId]
  );
}

export async function saveNegotiationTranscript(
  sessionId: string,
  transcript: unknown[],
  agreedPrice?: number,
  status?: string
): Promise<void> {
  await db.query(
    `UPDATE negotiation_sessions
     SET transcript = $1,
         agreed_price = COALESCE($2, agreed_price),
         status = COALESCE($3, status),
         updated_at = NOW()
     WHERE id = $4`,
    [JSON.stringify(transcript), agreedPrice ?? null, status ?? null, sessionId]
  );
}
