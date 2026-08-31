import { db } from "@zapai/database";
import { getShopifyClient } from "./client.ts";
import { getShopifyConnection } from "./auth.ts";
import { logger } from "../../core/logger/index.ts";

export async function reconcileInventoryFromShopify(
  storeId: string,
  shopifyVariantId: string
): Promise<{ success: boolean; inventoryAvailable?: number; error?: string }> {
  try {
    const conn = await getShopifyConnection(storeId);
    if (!conn || !conn.accessToken || !conn.shopDomain) {
      return { success: false, error: "No Shopify connection configured for this store" };
    }

    const client = getShopifyClient(conn.shopDomain, conn.accessToken);
    const res = await client.get(`/variants/${shopifyVariantId}.json`);

    const variant = res.data?.variant;
    if (!variant) {
      return { success: false, error: `Shopify variant ${shopifyVariantId} not found` };
    }

    const quantity = variant.inventory_quantity !== undefined ? parseInt(variant.inventory_quantity, 10) : 0;

    await db.query(
      `UPDATE products
       SET
         inventory_available = $1,
         inventory_state = CASE WHEN $1 <= 0 THEN 'SOLD' ELSE 'AVAILABLE' END,
         updated_at = NOW()
       WHERE store_id = $2 AND shopify_variant_id = $3`,
      [quantity, storeId, shopifyVariantId]
    );

    return {
      success: true,
      inventoryAvailable: quantity,
    };
  } catch (err: any) {
    logger.error({ err: err.message, storeId, shopifyVariantId }, "Failed to reconcile inventory from Shopify");
    return { success: false, error: err.message };
  }
}
