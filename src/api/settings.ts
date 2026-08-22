import { Router } from "express";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

const router = Router();

// GET /api/v1/settings/rules — Fetch store negotiation rules
router.get("/rules", async (req: Request, res: Response) => {
  try {
    const storeId = (req.query.storeId as string) || "a0000000-0000-0000-0000-000000000001";
    const { rows } = await db.query(
      `SELECT * FROM negotiation_rules WHERE store_id = $1 LIMIT 1`,
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
    const storeId = (req.body.storeId as string) || "a0000000-0000-0000-0000-000000000001";
    const {
      maxDiscountPercent,
      minimumOrderValue,
      freeShippingAbove,
      bundleOffersEnabled,
      alternativeProductsEnabled,
      humanApprovalAbove,
      riskProfile,
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO negotiation_rules (
        store_id, max_discount_percentage, min_order_value_for_discount,
        free_shipping_threshold, allow_bundle_offers, alternative_products_enabled,
        human_approval_above, risk_profile
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
      RETURNING *`,
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

    // Also update existing record if present
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
    const storeId = (req.query.storeId as string) || "a0000000-0000-0000-0000-000000000001";
    const { rows } = await db.query(
      `SELECT agent_settings FROM stores WHERE id = $1 LIMIT 1`,
      [storeId]
    );

    const s = rows[0]?.agent_settings || {};
    return res.json({
      name: s.name || "RunFast AI Seller",
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
    const storeId = (req.body.storeId as string) || "a0000000-0000-0000-0000-000000000001";
    const {
      name,
      tone,
      status,
      autoNegotiationEnabled,
      humanEscalationEnabled,
      escalationThresholdAmount,
    } = req.body;

    const agentSettings = {
      name: name || "RunFast AI Seller",
      tone: tone || "friendly",
      status: status || "active",
      autoNegotiationEnabled: autoNegotiationEnabled ?? true,
      humanEscalationEnabled: humanEscalationEnabled ?? true,
      escalationThresholdAmount: escalationThresholdAmount || 5000,
    };

    await db.query(
      `UPDATE stores
       SET agent_settings = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(agentSettings), storeId]
    );

    return res.json(agentSettings);
  } catch (err) {
    console.error("Save agent settings error:", err);
    return res.status(500).json({ error: "Failed to save agent profile" });
  }
});

export default router;
