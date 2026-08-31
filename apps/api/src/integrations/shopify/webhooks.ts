import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@zapai/database";
import { upsertProductsToDb, ShopifyProductItem } from "./catalog.ts";
import { reconcileInventoryFromShopify } from "./inventory.ts";
import { logEvent } from "../../services/audit.ts";
import { logger } from "../../core/logger/index.ts";
import { env } from "../../config/env.ts";

export function verifyShopifyWebhookHmac(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
    const hmac = createHmac("sha256", secret).update(rawBuffer).digest("base64");

    const headerBuf = Buffer.from(signatureHeader.trim(), "utf8");
    const calculatedBuf = Buffer.from(hmac, "utf8");

    if (headerBuf.length !== calculatedBuf.length) {
      return false;
    }

    return timingSafeEqual(headerBuf, calculatedBuf);
  } catch (err) {
    logger.error({ err }, "Shopify webhook HMAC verification error");
    return false;
  }
}

export interface WebhookEventProcessParams {
  topic: string;
  shopDomain: string;
  webhookId?: string;
  payload: any;
}

export async function processShopifyWebhookEvent(
  params: WebhookEventProcessParams
): Promise<{ success: boolean; error?: string }> {
  const { topic, shopDomain, webhookId, payload } = params;

  // 1. Resolve store_id from shop domain
  const { rows: connRows } = await db.query(
    `SELECT store_id FROM shopify_connections
     WHERE shop_domain = $1 OR myshopify_domain = $1
     LIMIT 1`,
    [shopDomain]
  );

  let storeId = connRows[0]?.store_id;

  if (!storeId) {
    const { rows: storeRows } = await db.query(
      `SELECT id FROM stores
       WHERE agent_settings->'credentials'->>'shopifyShopDomain' = $1
          OR agent_settings->'shopify'->>'domain' = $1
       LIMIT 1`,
      [shopDomain]
    );
    storeId = storeRows[0]?.id;
  }

  if (!storeId) {
    logger.warn({ shopDomain, topic }, "Shopify webhook: No store found matching domain");
    return { success: false, error: `No store registered for domain ${shopDomain}` };
  }

  // 2. Idempotency record check & insertion
  const eventKey = webhookId || `${shopDomain}_${topic}_${payload?.id || Date.now()}`;

  const { rows: existingEvent } = await db.query(
    `SELECT id, status FROM shopify_sync_events WHERE shopify_event_id = $1 LIMIT 1`,
    [eventKey]
  );

  if (existingEvent.length > 0) {
    logger.info({ eventKey, topic }, "Shopify webhook event already processed (idempotency skipped)");
    return { success: true };
  }

  await db.query(
    `INSERT INTO shopify_sync_events (
      store_id, topic, shopify_event_id, shop_domain, payload, status, processed_at
    ) VALUES ($1, $2, $3, $4, $5, 'PROCESSED', NOW())
    ON CONFLICT (shopify_event_id) DO NOTHING`,
    [storeId, topic, eventKey, shopDomain, JSON.stringify(payload)]
  );

  // 3. Process according to webhook topic
  try {
    switch (topic) {
      case "products/create":
      case "products/update": {
        const p = payload;
        if (!p || !p.id) break;

        const prodTitle = p.title || "Untitled Product";
        const prodCategory = p.product_type || "General";
        const prodDescription = (p.body_html || "").replace(/<[^>]*>?/gm, "").trim();
        const prodImage = p.images?.[0]?.src || p.image?.src || null;

        // Fetch discount ceiling from store rules
        const { rows: ruleRow } = await db.query(
          "SELECT max_discount_percentage FROM negotiation_rules WHERE store_id = $1 LIMIT 1",
          [storeId]
        );
        const discountPercentage = ruleRow[0]?.max_discount_percentage
          ? parseFloat(ruleRow[0].max_discount_percentage)
          : 15;

        const variants = p.variants && p.variants.length > 0 ? p.variants : [{}];
        const items: ShopifyProductItem[] = [];

        for (let vIdx = 0; vIdx < variants.length; vIdx++) {
          const v = variants[vIdx];
          const variantTitle = v.title && v.title !== "Default Title" ? `${prodTitle} (${v.title})` : prodTitle;
          const listedPrice = Math.max(1, parseFloat(v.price || p.price || "999") || 999);
          const floorPrice = Math.round(listedPrice * (1 - (discountPercentage / 100)));
          const inventory = v.inventory_quantity !== undefined && v.inventory_quantity !== null
            ? Math.max(0, parseInt(v.inventory_quantity, 10))
            : 10;
          const sku = v.sku || `SHOPIFY-${p.id}-${v.id || vIdx}`;

          items.push({
            id: `prod_shp_${p.id}_${v.id || vIdx}`,
            shopifyProductId: String(p.id),
            shopifyVariantId: String(v.id || p.id),
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

        await upsertProductsToDb(storeId, items, shopDomain);
        logger.info({ topic, storeId, productId: p.id }, "Upserted product from Shopify webhook");
        break;
      }

      case "products/delete": {
        const productId = String(payload?.id);
        if (productId) {
          await db.query(
            `UPDATE products
             SET is_ai_enabled = false, inventory_available = 0, updated_at = NOW()
             WHERE store_id = $1 AND shopify_product_id = $2`,
            [storeId, productId]
          );
          logger.info({ topic, storeId, productId }, "Disabled deleted Shopify product");
        }
        break;
      }

      case "inventory_levels/update": {
        const inventoryItemId = payload?.inventory_item_id;
        const available = payload?.available;

        if (inventoryItemId !== undefined && available !== undefined) {
          await db.query(
            `UPDATE products
             SET
               inventory_available = $1,
               inventory_state = CASE WHEN $1 <= 0 THEN 'SOLD' ELSE 'AVAILABLE' END,
               updated_at = NOW()
             WHERE store_id = $2 AND agent_schema->>'inventoryItemId' = $3`,
            [parseInt(available, 10), storeId, String(inventoryItemId)]
          );
        }
        break;
      }

      case "orders/create": {
        // If order created on Shopify website, reconcile stock for line items
        const lineItems = payload?.line_items || [];
        for (const item of lineItems) {
          if (item.variant_id) {
            await reconcileInventoryFromShopify(storeId, String(item.variant_id));
          }
        }
        break;
      }

      default:
        logger.info({ topic }, "Unhandled Shopify webhook topic");
    }

    // Log to 5-Way Audit Ledger
    await logEvent(
      "SHOPIFY_WEBHOOK_PROCESSED",
      {
        x402TransactionId: `x402_wh_${Date.now()}`,
        storeId,
      },
      {
        topic,
        shopDomain,
        webhookId: eventKey,
        timestamp: new Date().toISOString(),
      }
    );

    return { success: true };
  } catch (err: any) {
    logger.error({ err: err.message, topic, storeId }, "Error processing Shopify webhook event");
    await db.query(
      `UPDATE shopify_sync_events SET status = 'FAILED', error = $1 WHERE shopify_event_id = $2`,
      [err.message, eventKey]
    );
    return { success: false, error: err.message };
  }
}
