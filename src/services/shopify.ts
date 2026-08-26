import axios from "axios";
import { db } from "../db/migrate.ts";
import { logEvent } from "./audit.ts";

export interface ShopifyShopInfo {
  id: number;
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  currency: string;
  country_name?: string;
  plan_name?: string;
}

export interface ShopifyProductItem {
  id: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  title: string;
  sku: string;
  listedPrice: number;
  floorPrice: number;
  inventoryAvailable: number;
  category: string;
  description: string;
  imageUrl: string | null;
}

/**
 * Normalizes a raw shop domain string (e.g. "https://brand.myshopify.com/" -> "brand.myshopify.com")
 */
export function normalizeShopDomain(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.replace(/\/.*$/, "");
  if (!clean.includes(".")) {
    clean = `${clean}.myshopify.com`;
  }
  return clean;
}

/**
 * Validates Shopify credentials against the official Shopify Admin REST API.
 * Calls GET /admin/api/2024-01/shop.json
 */
export async function verifyShopifyCredentials(
  shopDomain: string,
  accessToken: string
): Promise<{ valid: boolean; shop?: ShopifyShopInfo; error?: string }> {
  const domain = normalizeShopDomain(shopDomain);
  const token = accessToken.trim();

  if (!domain || !domain.includes(".myshopify.com")) {
    return { valid: false, error: "Invalid Shopify domain. Must be in format 'brand-name.myshopify.com'" };
  }

  if (!token) {
    return { valid: false, error: "Shopify Admin API Access Token is required (starts with 'shpat_')" };
  }

  try {
    const url = `https://${domain}/admin/api/2024-01/shop.json`;
    const res = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    });

    if (res.status === 200 && res.data?.shop) {
      return { valid: true, shop: res.data.shop };
    }

    return { valid: false, error: "Shopify returned an unexpected response." };
  } catch (err: any) {
    if (err.response) {
      if (err.response.status === 401 || err.response.status === 403) {
        return {
          valid: false,
          error: "Authentication failed. Invalid Admin API token or insufficient permissions.",
        };
      }
      if (err.response.status === 404) {
        return {
          valid: false,
          error: `Shopify store '${domain}' not found. Please verify the subdomain.`,
        };
      }
      return {
        valid: false,
        error: `Shopify API error (${err.response.status}): ${err.response.data?.errors || err.message}`,
      };
    }
    return {
      valid: false,
      error: `Network error connecting to Shopify: ${err.message}`,
    };
  }
}

/**
 * Fetches products from Shopify Admin REST API and formats them for ZapAI catalog.
 */
export async function fetchShopifyProducts(
  shopDomain: string,
  accessToken: string,
  discountPercentage: number = 15
): Promise<ShopifyProductItem[]> {
  const domain = normalizeShopDomain(shopDomain);
  const token = accessToken.trim();

  const url = `https://${domain}/admin/api/2024-01/products.json?limit=250`;
  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  const rawProducts = res.data?.products || [];
  const items: ShopifyProductItem[] = [];

  for (const p of rawProducts) {
    const prodTitle = p.title || "Untitled Product";
    const prodCategory = p.product_type || "General";
    const prodDescription = (p.body_html || "").replace(/<[^>]*>?/gm, "").trim();
    const prodImage = p.images?.[0]?.src || p.image?.src || null;

    const variants = p.variants && p.variants.length > 0 ? p.variants : [{}];

    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const v = variants[vIdx];
      const variantTitle = v.title && v.title !== "Default Title" ? `${prodTitle} (${v.title})` : prodTitle;
      const listedPrice = Math.max(1, parseFloat(v.price || p.price || "999") || 999);
      const floorPrice = Math.round(listedPrice * (1 - (discountPercentage / 100)));
      const inventory = v.inventory_quantity !== undefined && v.inventory_quantity !== null
        ? Math.max(0, parseInt(v.inventory_quantity, 10))
        : 10;
      const sku = v.sku || `SHOPIFY-${p.id}-${v.id || vIdx}`;
      const shopifyProductId = String(p.id);
      const shopifyVariantId = String(v.id || p.id);

      items.push({
        id: `prod_shp_${p.id}_${v.id || vIdx}`,
        shopifyProductId,
        shopifyVariantId,
        title: variantTitle,
        sku,
        listedPrice,
        floorPrice,
        inventoryAvailable: inventory,
        category: prodCategory,
        description: prodDescription,
        imageUrl: prodImage,
      });
    }
  }

  return items;
}

/**
 * Persists Shopify credentials into store's agent_settings and syncs products into PostgreSQL database.
 */
export async function syncShopifyToStore(
  storeId: string,
  shopDomain: string,
  accessToken: string,
  defaultDiscountPercent: number = 15
): Promise<{ success: boolean; syncedCount: number; shop: ShopifyShopInfo }> {
  const domain = normalizeShopDomain(shopDomain);
  const token = accessToken.trim();

  // 1. Verify credentials
  const verification = await verifyShopifyCredentials(domain, token);
  if (!verification.valid || !verification.shop) {
    throw new Error(verification.error || "Failed to authenticate with Shopify");
  }

  const shop = verification.shop;

  // 2. Update store credentials in DB
  const { rows: storeRows } = await db.query(
    "SELECT agent_settings, name FROM stores WHERE id = $1 LIMIT 1",
    [storeId]
  );

  const prevSettings = storeRows[0]?.agent_settings || {};
  const prevCreds = prevSettings.credentials || {};

  const updatedCreds = {
    ...prevCreds,
    shopifyShopDomain: domain,
    shopifyAccessToken: token,
    hasShopifyAccessToken: true,
  };

  const updatedSettings = {
    ...prevSettings,
    credentials: updatedCreds,
    shopify: {
      domain,
      shopName: shop.name,
      currency: shop.currency,
      email: shop.email,
      lastSyncedAt: new Date().toISOString(),
    },
  };

  await db.query(
    `UPDATE stores
     SET
       agent_settings = $1,
       name = CASE WHEN name = 'ZapAI Store' OR name = 'Merchant Store' THEN $2 ELSE name END,
       currency = COALESCE($3, currency),
       updated_at = NOW()
     WHERE id = $4`,
    [
      JSON.stringify(updatedSettings),
      shop.name || "Shopify Store",
      shop.currency || "INR",
      storeId,
    ]
  );

  // 3. Fetch live products from Shopify
  const products = await fetchShopifyProducts(domain, token, defaultDiscountPercent);

  // 4. Batch upsert products into PostgreSQL
  let syncedCount = 0;
  for (const item of products) {
    const agentSchema = {
      variantId: item.shopifyVariantId,
      title: item.title,
      sku: item.sku,
      listedPrice: item.listedPrice,
      floorPrice: item.floorPrice,
      inventoryAvailable: item.inventoryAvailable,
      attributes: {
        category: item.category,
        description: item.description,
        source: "SHOPIFY",
        shopDomain: domain,
      },
    };

    await db.query(
      `INSERT INTO products (
        store_id, shopify_product_id, shopify_variant_id,
        title, sku, listed_price, floor_price,
        inventory_available, inventory_reserved, inventory_state,
        is_ai_enabled, category, description, image_url, agent_schema,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'AVAILABLE', true, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (store_id, shopify_variant_id) DO UPDATE SET
        title = EXCLUDED.title,
        sku = EXCLUDED.sku,
        listed_price = EXCLUDED.listed_price,
        floor_price = EXCLUDED.floor_price,
        inventory_available = EXCLUDED.inventory_available,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        image_url = COALESCE(EXCLUDED.image_url, products.image_url),
        agent_schema = EXCLUDED.agent_schema,
        is_ai_enabled = true,
        updated_at = NOW()`,
      [
        storeId,
        item.shopifyProductId,
        item.shopifyVariantId,
        item.title,
        item.sku,
        item.listedPrice,
        item.floorPrice,
        item.inventoryAvailable,
        item.category,
        item.description,
        item.imageUrl,
        JSON.stringify(agentSchema),
      ]
    );
    syncedCount++;
  }

  // 5. Log event in cryptographic audit ledger
  await logEvent(
    "PRODUCT_SYNCED",
    {
      x402TransactionId: `x402_sync_${Date.now()}`,
      storeId,
    },
    {
      storeId,
      shopDomain: domain,
      shopName: shop.name,
      syncedProductsCount: syncedCount,
      timestamp: new Date().toISOString(),
    }
  );

  return {
    success: true,
    syncedCount,
    shop,
  };
}
