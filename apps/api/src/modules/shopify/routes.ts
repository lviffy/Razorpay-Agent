import { Router } from "express";
import { db } from "@zapai/database";
import {
  verifyShopifyCredentials,
  syncShopifyToStore,
  getShopifyConnection,
  disconnectShopifyConnection,
  normalizeShopDomain,
} from "../../integrations/shopify/index.ts";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

const router = Router();

const JWT_SECRET = env.JWT_SECRET || "zapai_jwt_secret_neon_auth_2026";

async function getStoreIdFromReq(req: Request): Promise<string | null> {
  const storeIdQuery = (req.query.storeId as string) || (req.body?.storeId as string);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (storeIdQuery && uuidRegex.test(storeIdQuery)) {
    return storeIdQuery;
  }

  const storeIdHeader = req.headers["x-store-id"] as string | undefined;
  if (storeIdHeader && uuidRegex.test(storeIdHeader)) {
    return storeIdHeader;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded?.storeId && uuidRegex.test(decoded.storeId)) {
        return decoded.storeId;
      }
      if (decoded?.userId) {
        const { rows } = await db.query(
          "SELECT store_id FROM users WHERE id = $1 LIMIT 1",
          [decoded.userId]
        );
        if (rows[0]?.store_id) return rows[0].store_id;
      }
    } catch {
      // ignore
    }
  }

  const { rows } = await db.query(
    "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
  );
  return rows[0]?.id || null;
}

// POST /api/v1/shopify/test
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { shopDomain, accessToken } = req.body;
    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: "shopDomain and accessToken are required" });
    }

    const result = await verifyShopifyCredentials(shopDomain, accessToken);
    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      shop: result.shop,
      message: `Verified connection with "${result.shop?.name}" (${result.shop?.myshopify_domain})`,
    });
  } catch (err: any) {
    logger.error({ err }, "Shopify test error");
    return res.status(500).json({ error: err.message || "Failed to test Shopify connection" });
  }
});

// POST /api/v1/shopify/verify-and-sync
router.post("/verify-and-sync", async (req: Request, res: Response) => {
  try {
    const { shopDomain, accessToken, maxDiscountPercent = 15 } = req.body;
    let storeId = await getStoreIdFromReq(req);

    if (!shopDomain || !accessToken) {
      return res.status(400).json({ error: "shopDomain and accessToken are required" });
    }

    if (!storeId) {
      const { rows: newStore } = await db.query(
        `INSERT INTO stores (name, currency, is_active)
         VALUES ('Shopify Store', 'INR', true)
         RETURNING id`
      );
      storeId = newStore[0].id;
    }

    const result = await syncShopifyToStore(
      storeId!,
      shopDomain,
      accessToken,
      Number(maxDiscountPercent) || 15
    );

    return res.json({
      success: true,
      storeId,
      syncedCount: result.syncedCount,
      shop: result.shop,
      message: `Successfully authenticated and synced ${result.syncedCount} products from ${result.shop.name}!`,
    });
  } catch (err: any) {
    logger.error({ err }, "Shopify verify & sync error");
    return res.status(400).json({
      success: false,
      error: err.message || "Failed to verify and sync Shopify store",
    });
  }
});

// GET /api/v1/shopify/status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    if (!storeId) {
      return res.json({ connected: false });
    }

    const conn = await getShopifyConnection(storeId);

    const { rows: prodCount } = await db.query(
      "SELECT COUNT(*) as count FROM products WHERE store_id = $1 AND shopify_product_id IS NOT NULL AND shopify_product_id != ''",
      [storeId]
    );

    const productCount = parseInt(prodCount[0]?.count || "0", 10);
    const appUrl = env.APP_URL || "http://localhost:8000";

    if (conn && conn.status !== "disconnected" && conn.accessToken) {
      return res.json({
        connected: true,
        shopDomain: conn.shopDomain,
        shopName: conn.shopName,
        myshopifyDomain: conn.myshopifyDomain,
        currency: conn.currency || "INR",
        productCount: productCount || conn.productsSyncedCount,
        lastSyncedAt: conn.lastSyncedAt || null,
        webhookUrl: `${appUrl}/webhooks/shopify`,
        hasWebhookSecret: Boolean(conn.webhookSecret || env.SHOPIFY_WEBHOOK_SECRET),
        maskedToken: conn.accessToken
          ? `${conn.accessToken.slice(0, 8)}••••••••${conn.accessToken.slice(-4)}`
          : null,
      });
    }

    return res.json({
      connected: false,
      productCount,
      webhookUrl: `${appUrl}/webhooks/shopify`,
    });
  } catch (err: any) {
    logger.error({ err }, "Shopify status error");
    return res.status(500).json({ error: "Failed to get Shopify status" });
  }
});

// POST /api/v1/shopify/resync
router.post("/resync", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    if (!storeId) {
      return res.status(404).json({ error: "Store not found" });
    }

    const conn = await getShopifyConnection(storeId);
    if (!conn || !conn.accessToken || !conn.shopDomain) {
      return res.status(400).json({
        error: "No Shopify credentials saved for this store. Please connect Shopify first.",
      });
    }

    const { rows: ruleRow } = await db.query(
      "SELECT max_discount_percentage FROM negotiation_rules WHERE store_id = $1 LIMIT 1",
      [storeId]
    );
    const maxDiscount = ruleRow[0]?.max_discount_percentage
      ? parseFloat(ruleRow[0].max_discount_percentage)
      : 15;

    const result = await syncShopifyToStore(storeId, conn.shopDomain, conn.accessToken, maxDiscount);

    return res.json({
      success: true,
      syncedCount: result.syncedCount,
      shop: result.shop,
      message: `Re-synced ${result.syncedCount} products from ${result.shop.name}`,
    });
  } catch (err: any) {
    logger.error({ err }, "Shopify resync error");
    return res.status(500).json({ error: err.message || "Failed to resync Shopify catalog" });
  }
});

// POST /api/v1/shopify/disconnect
router.post("/disconnect", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    if (!storeId) {
      return res.status(404).json({ error: "Store not found" });
    }

    await disconnectShopifyConnection(storeId);

    return res.json({
      success: true,
      message: "Shopify store disconnected successfully",
    });
  } catch (err: any) {
    logger.error({ err }, "Shopify disconnect error");
    return res.status(500).json({ error: err.message || "Failed to disconnect Shopify store" });
  }
});

export default router;
