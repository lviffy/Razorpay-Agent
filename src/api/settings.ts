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
        maxDiscountPercent: 12,
        minimumOrderValue: 2000,
        freeShippingAbove: 3000,
        bundleOffersEnabled: true,
        alternativeProductsEnabled: true,
        humanApprovalAbove: 5000,
        riskProfile: "balanced",
      });
    }

    const r = rows[0];
    return res.json({
      maxDiscountPercent: parseFloat(r.max_discount_percentage || "12"),
      minimumOrderValue: parseFloat(r.min_order_value_for_discount || "2000"),
      freeShippingAbove: r.free_shipping_threshold ? parseFloat(r.free_shipping_threshold) : 3000,
      bundleOffersEnabled: r.allow_bundle_offers ?? true,
      alternativeProductsEnabled: r.alternative_products_enabled ?? true,
      humanApprovalAbove: r.human_approval_above ? parseFloat(r.human_approval_above) : 5000,
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
      await db.query(
        `UPDATE stores
         SET agent_settings = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(agentSettings), storeId]
      );
    }

    return res.json(agentSettings);
  } catch (err) {
    console.error("Save agent settings error:", err);
    return res.status(500).json({ error: "Failed to save agent profile" });
  }
});

export default router;
