import { Router, Request, Response } from "express";
import { verifyShopifyWebhookHmac, processShopifyWebhookEvent } from "../../integrations/shopify/index.ts";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";
import { db } from "@zapai/database";

const router = Router();

// POST /webhooks/shopify
router.post("/", async (req: Request, res: Response) => {
  const topic = req.headers["x-shopify-topic"] as string | undefined;
  const shopDomain = req.headers["x-shopify-shop-domain"] as string | undefined;
  const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string | undefined;
  const webhookId = req.headers["x-shopify-webhook-id"] as string | undefined;

  if (!topic || !shopDomain) {
    return res.status(400).json({ error: "Missing X-Shopify-Topic or X-Shopify-Shop-Domain headers" });
  }

  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // Attempt to resolve custom webhook secret for this store or fallback to env secret
  let webhookSecret = env.SHOPIFY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    const { rows } = await db.query(
      `SELECT webhook_secret FROM shopify_connections
       WHERE shop_domain = $1 OR myshopify_domain = $1
       LIMIT 1`,
      [shopDomain]
    );
    webhookSecret = rows[0]?.webhook_secret || "";
  }

  // If a webhook secret is configured, verify HMAC signature
  if (webhookSecret && hmacHeader) {
    const isValid = verifyShopifyWebhookHmac(rawBody, hmacHeader, webhookSecret);
    if (!isValid) {
      logger.warn({ shopDomain, topic }, "❌ Shopify webhook HMAC verification failed");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
  }

  // Acknowledge receipt to Shopify IMMEDIATELY (<50ms) to avoid timeout/retries
  res.status(200).json({ received: true, topic, shopDomain });

  // Process event in background (isolated, won't block webhook response)
  setImmediate(async () => {
    try {
      let payload = req.body;
      if (typeof payload === "string" || Buffer.isBuffer(payload)) {
        try {
          payload = JSON.parse(payload.toString("utf8"));
        } catch {
          // ignore
        }
      }

      await processShopifyWebhookEvent({
        topic,
        shopDomain,
        webhookId,
        payload,
      });
    } catch (err: any) {
      logger.error({ err: err.message, topic, shopDomain }, "Shopify async webhook processing error");
    }
  });
});

export default router;
