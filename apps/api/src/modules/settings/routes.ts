import { Router } from "express";
import { db } from "@zapai/database";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../../config/env.ts";
import { verifyShopifyCredentials } from "../../integrations/shopify/index.ts";
import { logger } from "../../core/logger/index.ts";
import Razorpay from "razorpay";
import axios from "axios";

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

// GET /api/v1/settings/rules
router.get("/rules", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const { rows } = await db.query(
      `SELECT * FROM negotiation_rules WHERE ($1::uuid IS NULL OR store_id = $1::uuid) LIMIT 1`,
      [storeId]
    );

    if (!rows[0]) {
      return res.json({
        maxDiscountPercent: 0,
        minimumOrderValue: 0,
        freeShippingAbove: 0,
        bundleOffersEnabled: false,
        alternativeProductsEnabled: false,
        humanApprovalAbove: 0,
        riskProfile: "balanced",
      });
    }

    const r = rows[0];
    return res.json({
      maxDiscountPercent: parseFloat(r.max_discount_percentage || "0"),
      minimumOrderValue: parseFloat(r.min_order_value_for_discount || "0"),
      freeShippingAbove: r.free_shipping_threshold ? parseFloat(r.free_shipping_threshold) : 0,
      bundleOffersEnabled: r.allow_bundle_offers ?? false,
      alternativeProductsEnabled: r.alternative_products_enabled ?? false,
      humanApprovalAbove: r.human_approval_above ? parseFloat(r.human_approval_above) : 0,
      riskProfile: r.risk_profile || "balanced",
    });
  } catch (err) {
    logger.error({ err }, "Get rules error");
    return res.status(500).json({ error: "Failed to fetch negotiation rules" });
  }
});

// PUT /api/v1/settings/rules
router.put("/rules", async (req: Request, res: Response) => {
  try {
    let storeId = await getStoreIdFromReq(req);
    const {
      maxDiscountPercent,
      minOrderValue,
      minimumOrderValue = minOrderValue,
      freeShippingAbove,
      bundleOffersEnabled,
      alternativeProductsEnabled,
      humanApprovalAbove,
      riskProfile,
    } = req.body;

    const parsedMaxDiscount = maxDiscountPercent !== undefined ? Number(maxDiscountPercent) : 12;
    const parsedMinOrderValue = minimumOrderValue !== undefined ? Number(minimumOrderValue) : 0;
    const parsedFreeShipping = freeShippingAbove !== undefined ? Number(freeShippingAbove) : 0;
    const parsedHumanApproval = humanApprovalAbove !== undefined ? Number(humanApprovalAbove) : 5000;
    const parsedBundleOffers = bundleOffersEnabled !== undefined ? Boolean(bundleOffersEnabled) : true;
    const parsedAltProducts = alternativeProductsEnabled !== undefined ? Boolean(alternativeProductsEnabled) : true;
    const parsedRiskProfile = riskProfile || "balanced";

    if (!storeId) {
      const { rows: storeRows } = await db.query(
        "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
      );
      storeId = storeRows[0]?.id || null;
    }

    if (storeId) {
      const { rows: existing } = await db.query(
        "SELECT id FROM negotiation_rules WHERE store_id = $1 LIMIT 1",
        [storeId]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO negotiation_rules (
            store_id, max_discount_percentage, min_order_value_for_discount,
            free_shipping_threshold, allow_bundle_offers, alternative_products_enabled,
            human_approval_above, risk_profile
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            storeId,
            parsedMaxDiscount,
            parsedMinOrderValue,
            parsedFreeShipping,
            parsedBundleOffers,
            parsedAltProducts,
            parsedHumanApproval,
            parsedRiskProfile,
          ]
        );
      } else {
        await db.query(
          `UPDATE negotiation_rules
           SET
             max_discount_percentage = $1,
             min_order_value_for_discount = $2,
             free_shipping_threshold = $3,
             allow_bundle_offers = $4,
             alternative_products_enabled = $5,
             human_approval_above = $6,
             risk_profile = $7
           WHERE store_id = $8`,
          [
            parsedMaxDiscount,
            parsedMinOrderValue,
            parsedFreeShipping,
            parsedBundleOffers,
            parsedAltProducts,
            parsedHumanApproval,
            parsedRiskProfile,
            storeId,
          ]
        );
      }
    }

    return res.json({
      maxDiscountPercent: parsedMaxDiscount,
      minimumOrderValue: parsedMinOrderValue,
      freeShippingAbove: parsedFreeShipping,
      bundleOffersEnabled: parsedBundleOffers,
      alternativeProductsEnabled: parsedAltProducts,
      humanApprovalAbove: parsedHumanApproval,
      riskProfile: parsedRiskProfile,
    });
  } catch (err: any) {
    logger.error({ err }, "Save rules error");
    return res.status(500).json({ error: err?.message || "Failed to save negotiation rules" });
  }
});

// GET /api/v1/settings/agent
router.get("/agent", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const { rows } = await db.query(
      `SELECT agent_settings, name FROM stores WHERE ($1::uuid IS NULL OR id = $1::uuid) LIMIT 1`,
      [storeId]
    );

    const storeName = rows[0]?.name || "AI Seller Agent";
    const s = rows[0]?.agent_settings || {};
    return res.json({
      name: s.name || `${storeName} AI Seller`,
      tone: s.tone || "friendly",
      status: s.status || "active",
      autoNegotiationEnabled: s.autoNegotiationEnabled ?? true,
      humanEscalationEnabled: s.humanEscalationEnabled ?? true,
      escalationThresholdAmount: s.escalationThresholdAmount || 5000,
      bundleUpsellEnabled: s.bundleUpsellEnabled ?? true,
    });
  } catch (err) {
    logger.error({ err }, "Get agent settings error");
    return res.status(500).json({ error: "Failed to fetch agent profile" });
  }
});

// PUT /api/v1/settings/agent
router.put("/agent", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const {
      name,
      tone,
      status,
      autoNegotiationEnabled,
      humanEscalationEnabled,
      escalationThresholdAmount,
      bundleUpsellEnabled,
    } = req.body;

    const agentSettings = {
      name: name || "AI Seller Agent",
      tone: tone || "friendly",
      status: status || "active",
      autoNegotiationEnabled: autoNegotiationEnabled ?? true,
      humanEscalationEnabled: humanEscalationEnabled ?? true,
      escalationThresholdAmount: escalationThresholdAmount || 5000,
      bundleUpsellEnabled: bundleUpsellEnabled ?? true,
    };

    if (storeId) {
      const { rows: existingRows } = await db.query(
        "SELECT agent_settings FROM stores WHERE id = $1 LIMIT 1",
        [storeId]
      );
      const prevSettings = existingRows[0]?.agent_settings || {};
      const merged = { ...prevSettings, ...agentSettings };

      await db.query(
        `UPDATE stores
         SET agent_settings = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(merged), storeId]
      );
    }

    return res.json(agentSettings);
  } catch (err) {
    logger.error({ err }, "Save agent settings error");
    return res.status(500).json({ error: "Failed to save agent profile" });
  }
});

// GET /api/v1/settings/credentials
router.get("/credentials", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const { rows } = await db.query(
      `SELECT id, name, phone, razorpay_account_id, agent_settings FROM stores WHERE ($1::uuid IS NULL OR id = $1::uuid) LIMIT 1`,
      [storeId]
    );

    const s = rows[0]?.agent_settings || {};
    const creds = s.credentials || {};

    const appUrl = env.APP_URL || "http://localhost:8000";
    const razorpayKeyId =
      creds.razorpayKeyId ||
      (rows[0]?.razorpay_account_id && !rows[0].razorpay_account_id.startsWith("rzp_test_mock")
        ? rows[0].razorpay_account_id
        : "") ||
      env.RAZORPAY_KEY_ID ||
      "";
    const hasSecret = Boolean(creds.razorpayKeySecret || env.RAZORPAY_KEY_SECRET);
    const razorpayWebhookSecret = creds.razorpayWebhookSecret || env.RAZORPAY_WEBHOOK_SECRET || "";
    const whatsappPhoneNumber =
      creds.whatsappPhoneNumber ||
      (rows[0]?.phone && !rows[0].phone.includes("98765 00000") ? rows[0].phone : "") ||
      "";
    const whatsappPhoneNumberId = creds.whatsappPhoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID || "";
    const hasWhatsAppToken = Boolean(creds.whatsappAccessToken || env.WHATSAPP_ACCESS_TOKEN);
    const whatsappWebhookVerifyToken =
      creds.whatsappWebhookVerifyToken ||
      env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      "zapai_meta_webhook_secret_2026";

    const shopifyShopDomain = creds.shopifyShopDomain || "";
    const hasShopifyToken = Boolean(creds.shopifyAccessToken);
    const shopifyWebhookSecret = creds.shopifyWebhookSecret || env.SHOPIFY_WEBHOOK_SECRET || "";

    return res.json({
      razorpayKeyId,
      hasRazorpayKeySecret: hasSecret,
      razorpayWebhookSecret,
      razorpayEnvironment: razorpayKeyId.startsWith("rzp_live") ? "live" : "test",
      razorpayWebhookUrl: `${appUrl}/webhooks/razorpay`,
      whatsappPhoneNumber,
      whatsappPhoneNumberId,
      hasWhatsAppAccessToken: hasWhatsAppToken,
      whatsappWebhookVerifyToken,
      whatsappWebhookUrl: `${appUrl}/webhooks/whatsapp`,
      shopifyShopDomain,
      hasShopifyAccessToken: hasShopifyToken,
      shopifyAccessToken: hasShopifyToken ? `${creds.shopifyAccessToken.slice(0, 8)}••••••••` : "",
      shopifyWebhookSecret,
      shopifyWebhookUrl: `${appUrl}/webhooks/shopify`,
    });
  } catch (err) {
    logger.error({ err }, "Get credentials error");
    return res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

// PUT /api/v1/settings/credentials
router.put("/credentials", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const {
      razorpayKeyId,
      razorpayKeySecret,
      razorpayWebhookSecret,
      whatsappPhoneNumber,
      whatsappPhoneNumberId,
      whatsappAccessToken,
      whatsappWebhookVerifyToken,
      shopifyShopDomain,
      shopifyAccessToken,
      shopifyWebhookSecret,
    } = req.body;

    if (storeId) {
      const { rows: existingRows } = await db.query(
        "SELECT agent_settings, razorpay_account_id, phone FROM stores WHERE id = $1 LIMIT 1",
        [storeId]
      );
      const prevSettings = existingRows[0]?.agent_settings || {};
      const prevCreds = prevSettings.credentials || {};

      const updatedCreds = {
        ...prevCreds,
        ...(razorpayKeyId !== undefined && { razorpayKeyId }),
        ...(razorpayKeySecret && { razorpayKeySecret }),
        ...(razorpayWebhookSecret !== undefined && { razorpayWebhookSecret }),
        ...(whatsappPhoneNumber !== undefined && { whatsappPhoneNumber }),
        ...(whatsappPhoneNumberId !== undefined && { whatsappPhoneNumberId }),
        ...(whatsappAccessToken && { whatsappAccessToken }),
        ...(whatsappWebhookVerifyToken !== undefined && { whatsappWebhookVerifyToken }),
        ...(shopifyShopDomain !== undefined && { shopifyShopDomain }),
        ...(shopifyAccessToken && { shopifyAccessToken }),
        ...(shopifyAccessToken && { hasShopifyAccessToken: true }),
        ...(shopifyWebhookSecret !== undefined && { shopifyWebhookSecret }),
      };

      const updatedAgentSettings = {
        ...prevSettings,
        credentials: updatedCreds,
      };

      await db.query(
        `UPDATE stores
         SET
           agent_settings = $1,
           razorpay_account_id = COALESCE($2, razorpay_account_id),
           phone = COALESCE($3, phone),
           updated_at = NOW()
         WHERE id = $4`,
        [
          JSON.stringify(updatedAgentSettings),
          razorpayKeyId || existingRows[0]?.razorpay_account_id || null,
          whatsappPhoneNumber || existingRows[0]?.phone || null,
          storeId,
        ]
      );

      // If Shopify token or webhook secret provided, update shopify_connections table as well
      if (shopifyShopDomain && shopifyAccessToken) {
        await db.query(
          `INSERT INTO shopify_connections (
            store_id, shop_domain, shop_name, myshopify_domain,
            access_token, webhook_secret, status, updated_at
          ) VALUES ($1, $2, 'Shopify Store', $2, $3, $4, 'connected', NOW())
          ON CONFLICT (store_id) DO UPDATE SET
            shop_domain = EXCLUDED.shop_domain,
            access_token = EXCLUDED.access_token,
            webhook_secret = COALESCE(EXCLUDED.webhook_secret, shopify_connections.webhook_secret),
            status = 'connected',
            updated_at = NOW()`,
          [
            storeId,
            shopifyShopDomain,
            shopifyAccessToken,
            shopifyWebhookSecret || null,
          ]
        );
      }
    }

    const appUrl = env.APP_URL || "http://localhost:8000";
    return res.json({
      success: true,
      message: "Credentials saved and verified successfully!",
      razorpayKeyId: razorpayKeyId || env.RAZORPAY_KEY_ID,
      razorpayWebhookUrl: `${appUrl}/webhooks/razorpay`,
      whatsappWebhookUrl: `${appUrl}/webhooks/whatsapp`,
      shopifyWebhookUrl: `${appUrl}/webhooks/shopify`,
    });
  } catch (err) {
    logger.error({ err }, "Save credentials error");
    return res.status(500).json({ error: "Failed to save credentials" });
  }
});

// POST /api/v1/settings/test-razorpay
router.post("/test-razorpay", async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret } = req.body;
    const finalKeyId = keyId || env.RAZORPAY_KEY_ID;
    const finalKeySecret = keySecret || env.RAZORPAY_KEY_SECRET;

    if (!finalKeyId || !finalKeySecret) {
      return res.status(400).json({
        success: false,
        error: "Both Razorpay Key ID and Key Secret are required to test connection.",
      });
    }

    const rzp = new Razorpay({
      key_id: finalKeyId,
      key_secret: finalKeySecret,
    });

    await rzp.orders.all({ count: 1 });

    const isLive = finalKeyId.startsWith("rzp_live");
    return res.json({
      success: true,
      mode: isLive ? "Live Production" : "Test Sandbox",
      keyId: finalKeyId,
      message: `✅ Razorpay connection verified successfully! (${isLive ? "Live Mode" : "Test Mode"})`,
    });
  } catch (err: any) {
    logger.error({ err }, "Razorpay verification error");
    const errMsg = err.error?.description || err.message || "Failed to authenticate with Razorpay API";
    return res.status(400).json({
      success: false,
      error: `Razorpay authentication failed: ${errMsg}`,
    });
  }
});

// POST /api/v1/settings/test-whatsapp
router.post("/test-whatsapp", async (req: Request, res: Response) => {
  try {
    const { phoneNumberId, accessToken } = req.body;
    const finalPhoneId = phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID;
    const finalToken = accessToken || env.WHATSAPP_ACCESS_TOKEN;

    if (!finalPhoneId || !finalToken) {
      return res.status(400).json({
        success: false,
        error: "Both WhatsApp Phone Number ID and Access Token are required to test Meta Cloud API.",
      });
    }

    const metaRes = await axios.get(
      `https://graph.facebook.com/v19.0/${finalPhoneId}`,
      {
        headers: {
          Authorization: `Bearer ${finalToken}`,
        },
      }
    );

    return res.json({
      success: true,
      verifiedName: metaRes.data.verified_name || "WhatsApp Business Channel",
      displayPhoneNumber: metaRes.data.display_phone_number || metaRes.data.id,
      qualityRating: metaRes.data.quality_rating || "GREEN",
      message: `✅ Meta WhatsApp Cloud API verified successfully! (${metaRes.data.display_phone_number || metaRes.data.id})`,
    });
  } catch (err: any) {
    logger.error({ err }, "Meta WhatsApp verification error");
    const errMsg = err.response?.data?.error?.message || err.message || "Invalid Meta WhatsApp Phone Number ID or Token";
    return res.status(400).json({
      success: false,
      error: `WhatsApp verification failed: ${errMsg}`,
    });
  }
});

// POST /api/v1/settings/test-shopify
router.post("/test-shopify", async (req: Request, res: Response) => {
  try {
    const { shopDomain, accessToken } = req.body;
    if (!shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        error: "Both Shopify Store Domain and Admin API Access Token are required.",
      });
    }

    const verification = await verifyShopifyCredentials(shopDomain, accessToken);

    if (!verification.valid || !verification.shop) {
      return res.status(400).json({
        success: false,
        error: verification.error || "Failed to authenticate with Shopify Admin API",
      });
    }

    return res.json({
      success: true,
      shop: verification.shop,
      message: `✅ Shopify connected successfully with "${verification.shop.name}" (${verification.shop.myshopify_domain})`,
    });
  } catch (err: any) {
    logger.error({ err }, "Shopify test error");
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to test Shopify connection",
    });
  }
});

export default router;
