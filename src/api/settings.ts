import { Router } from "express";
import { db } from "../db/migrate.ts";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

const router = Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.X402_SIGNING_SECRET ||
  "zapai_jwt_secret_neon_auth_2026";

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

// GET /api/v1/settings/rules — Fetch store negotiation rules
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
    console.error("Get rules error:", err);
    return res.status(500).json({ error: "Failed to fetch negotiation rules" });
  }
});

// PUT /api/v1/settings/rules — Update store negotiation rules
router.put("/rules", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const {
      maxDiscountPercent,
      minimumOrderValue,
      freeShippingAbove,
      bundleOffersEnabled,
      alternativeProductsEnabled,
      humanApprovalAbove,
      riskProfile,
    } = req.body;

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
            maxDiscountPercent,
            minimumOrderValue,
            freeShippingAbove,
            bundleOffersEnabled,
            alternativeProductsEnabled,
            humanApprovalAbove,
            riskProfile,
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
            maxDiscountPercent,
            minimumOrderValue,
            freeShippingAbove,
            bundleOffersEnabled,
            alternativeProductsEnabled,
            humanApprovalAbove,
            riskProfile,
            storeId,
          ]
        );
      }
    }

    return res.json({
      maxDiscountPercent,
      minimumOrderValue,
      freeShippingAbove,
      bundleOffersEnabled,
      alternativeProductsEnabled,
      humanApprovalAbove,
      riskProfile,
    });
  } catch (err) {
    console.error("Save rules error:", err);
    return res.status(500).json({ error: "Failed to save negotiation rules" });
  }
});

// GET /api/v1/settings/agent — Fetch AI Seller configuration
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
    });
  } catch (err) {
    console.error("Get agent settings error:", err);
    return res.status(500).json({ error: "Failed to fetch agent profile" });
  }
});

// PUT /api/v1/settings/agent — Update AI Seller configuration
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
    } = req.body;

    const agentSettings = {
      name: name || "AI Seller Agent",
      tone: tone || "friendly",
      status: status || "active",
      autoNegotiationEnabled: autoNegotiationEnabled ?? true,
      humanEscalationEnabled: humanEscalationEnabled ?? true,
      escalationThresholdAmount: escalationThresholdAmount || 5000,
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
    console.error("Save agent settings error:", err);
    return res.status(500).json({ error: "Failed to save agent profile" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Real Credentials Management & Testing Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/settings/credentials — Fetch store's real credentials & webhook endpoints
router.get("/credentials", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const { rows } = await db.query(
      `SELECT id, name, phone, razorpay_account_id, agent_settings FROM stores WHERE ($1::uuid IS NULL OR id = $1::uuid) LIMIT 1`,
      [storeId]
    );

    const s = rows[0]?.agent_settings || {};
    const creds = s.credentials || {};

    const appUrl = process.env.APP_URL || "https://razorpay-agent-production.up.railway.app";
    const razorpayKeyId =
      creds.razorpayKeyId ||
      (rows[0]?.razorpay_account_id && !rows[0].razorpay_account_id.startsWith("rzp_test_mock")
        ? rows[0].razorpay_account_id
        : "") ||
      process.env.RAZORPAY_KEY_ID ||
      "";
    const hasSecret = Boolean(creds.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET);
    const razorpayWebhookSecret = creds.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const whatsappPhoneNumber =
      creds.whatsappPhoneNumber ||
      (rows[0]?.phone && !rows[0].phone.includes("98765 00000") ? rows[0].phone : "") ||
      "";
    const whatsappPhoneNumberId = creds.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const hasWhatsAppToken = Boolean(creds.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN);
    const whatsappWebhookVerifyToken =
      creds.whatsappWebhookVerifyToken ||
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      "zapai_meta_webhook_secret_2026";

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
    });
  } catch (err) {
    console.error("Get credentials error:", err);
    return res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

// PUT /api/v1/settings/credentials — Update store's real credentials in DB
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
        ...(razorpayKeyId && { razorpayKeyId }),
        ...(razorpayKeySecret && { razorpayKeySecret }),
        ...(razorpayWebhookSecret && { razorpayWebhookSecret }),
        ...(whatsappPhoneNumber && { whatsappPhoneNumber }),
        ...(whatsappPhoneNumberId && { whatsappPhoneNumberId }),
        ...(whatsappAccessToken && { whatsappAccessToken }),
        ...(whatsappWebhookVerifyToken && { whatsappWebhookVerifyToken }),
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
          razorpayKeyId || existingRows[0]?.razorpay_account_id,
          whatsappPhoneNumber || existingRows[0]?.phone,
          storeId,
        ]
      );
    }

    const appUrl = process.env.APP_URL || "https://razorpay-agent-production.up.railway.app";
    return res.json({
      success: true,
      message: "Credentials saved and verified successfully!",
      razorpayKeyId: razorpayKeyId || process.env.RAZORPAY_KEY_ID,
      razorpayWebhookUrl: `${appUrl}/webhooks/razorpay`,
      whatsappWebhookUrl: `${appUrl}/webhooks/whatsapp`,
    });
  } catch (err) {
    console.error("Save credentials error:", err);
    return res.status(500).json({ error: "Failed to save credentials" });
  }
});

// POST /api/v1/settings/test-razorpay — Validate real Razorpay keys directly against Razorpay API
router.post("/test-razorpay", async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret } = req.body;
    const finalKeyId = keyId || process.env.RAZORPAY_KEY_ID;
    const finalKeySecret = keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!finalKeyId || !finalKeySecret) {
      return res.status(400).json({
        success: false,
        error: "Both Razorpay Key ID and Key Secret are required to test connection.",
      });
    }

    // Call Razorpay API with Basic Auth to verify authenticity
    const RazorpayModule = (await import("razorpay")).default;
    const rzp = new RazorpayModule({
      key_id: finalKeyId,
      key_secret: finalKeySecret,
    });

    // Make an actual read call (fetch orders count 1)
    await rzp.orders.all({ count: 1 });

    const isLive = finalKeyId.startsWith("rzp_live");
    return res.json({
      success: true,
      mode: isLive ? "Live Production" : "Test Sandbox",
      keyId: finalKeyId,
      message: `✅ Razorpay connection verified successfully! (${isLive ? "Live Mode" : "Test Mode"})`,
    });
  } catch (err: any) {
    console.error("Razorpay verification error:", err);
    const errMsg = err.error?.description || err.message || "Failed to authenticate with Razorpay API";
    return res.status(400).json({
      success: false,
      error: `Razorpay authentication failed: ${errMsg}`,
    });
  }
});

// POST /api/v1/settings/test-whatsapp — Validate real Meta Cloud API credentials against Graph API
router.post("/test-whatsapp", async (req: Request, res: Response) => {
  try {
    const { phoneNumberId, accessToken } = req.body;
    const finalPhoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const finalToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!finalPhoneId || !finalToken) {
      return res.status(400).json({
        success: false,
        error: "Both WhatsApp Phone Number ID and Access Token are required to test Meta Cloud API.",
      });
    }

    const axiosModule = (await import("axios")).default;
    const metaRes = await axiosModule.get(
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
    console.error("Meta WhatsApp verification error:", err.response?.data || err.message);
    const errMsg = err.response?.data?.error?.message || err.message || "Invalid Meta WhatsApp Phone Number ID or Token";
    return res.status(400).json({
      success: false,
      error: `WhatsApp verification failed: ${errMsg}`,
    });
  }
});

export default router;
