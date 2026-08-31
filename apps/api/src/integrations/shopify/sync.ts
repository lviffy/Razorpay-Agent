import { db } from "@zapai/database";
import { verifyShopifyCredentials, saveShopifyConnection, normalizeShopDomain, ShopifyShopInfo } from "./auth.ts";
import { fetchShopifyProducts, upsertProductsToDb } from "./catalog.ts";
import { logEvent } from "../../services/audit.ts";
import { logger } from "../../core/logger/index.ts";

export interface SyncShopifyResult {
  success: boolean;
  syncedCount: number;
  shop: ShopifyShopInfo;
  message?: string;
}

export async function syncShopifyToStore(
  storeId: string,
  shopDomain: string,
  accessToken: string,
  defaultDiscountPercent: number = 15
): Promise<SyncShopifyResult> {
  const domain = normalizeShopDomain(shopDomain);
  const token = accessToken.trim();

  // 1. Verify credentials with Shopify API
  const verification = await verifyShopifyCredentials(domain, token);
  if (!verification.valid || !verification.shop) {
    throw new Error(verification.error || "Failed to authenticate with Shopify");
  }

  const shop = verification.shop;

  // 2. Persist connection in shopify_connections table & store settings
  await saveShopifyConnection(storeId, {
    shopDomain: domain,
    shopName: shop.name,
    myshopifyDomain: shop.myshopify_domain,
    accessToken: token,
    currency: shop.currency || "INR",
  });

  // 3. Fetch products from Shopify
  const products = await fetchShopifyProducts(domain, token, defaultDiscountPercent);

  // 4. Upsert into database cache
  const syncedCount = await upsertProductsToDb(storeId, products, domain);

  // 5. Update connection record statistics
  await db.query(
    `UPDATE shopify_connections
     SET
       products_synced_count = $1,
       last_synced_at = NOW(),
       updated_at = NOW()
     WHERE store_id = $2`,
    [syncedCount, storeId]
  );

  // 6. Log to 5-Way Audit Ledger
  await logEvent(
    "SHOPIFY_CATALOG_SYNCED",
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

  logger.info({ storeId, shopDomain: domain, syncedCount }, "✅ Shopify catalog synced successfully");

  return {
    success: true,
    syncedCount,
    shop,
    message: `Successfully synchronized ${syncedCount} items from ${shop.name}!`,
  };
}
