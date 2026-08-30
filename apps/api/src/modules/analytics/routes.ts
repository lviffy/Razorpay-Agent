import { Router } from "express";
import { db } from "@zapai/database";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

const router = Router();

const JWT_SECRET = env.JWT_SECRET || "zapai_jwt_secret_neon_auth_2026";

async function getStoreIdFromReq(req: Request): Promise<string | null> {
  const storeIdQuery = req.query.storeId as string | undefined;
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

  return null;
}

// GET /api/v1/analytics
router.get("/", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);

    const { rows: orderStats } = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN amount ELSE 0 END), 0) as total_gmv,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'CAPTURED' THEN 1 END) as captured_orders,
        COALESCE(AVG(CASE WHEN status = 'CAPTURED' THEN amount END), 0) as avg_order_value,
        COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN discount_applied ELSE 0 END), 0) as total_discount_given,
        COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN original_price ELSE 0 END), 0) as total_original_value
       FROM orders
       WHERE ($1::uuid IS NULL OR store_id = $1::uuid)`,
      [storeId]
    );

    const { rows: convStats } = await db.query(
      `SELECT
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'deal_closed' THEN 1 END) as closed_deals
       FROM conversations
       WHERE ($1::uuid IS NULL OR store_id = $1::uuid)`,
      [storeId]
    );

    const { rows: topProducts } = await db.query(
      `SELECT
        p.title,
        COUNT(o.id) as sales_count,
        COALESCE(SUM(o.amount), 0) as revenue
       FROM products p
       LEFT JOIN orders o ON (o.sku = p.sku OR o.product_title = p.title) AND o.status = 'CAPTURED'
       WHERE ($1::uuid IS NULL OR p.store_id = $1::uuid)
       GROUP BY p.id, p.title
       ORDER BY sales_count DESC, revenue DESC
       LIMIT 5`,
      [storeId]
    );

    const { rows: channelRows } = await db.query(
      `SELECT
        CASE WHEN p.shopify_product_id LIKE 'mock-prod%' OR p.shopify_product_id IS NULL THEN 'ZapAI Native Catalog' ELSE 'Shopify Connected Store' END as channel,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.amount), 0) as gmv
       FROM orders o
       LEFT JOIN products p ON (o.sku = p.sku OR o.product_title = p.title)
       WHERE ($1::uuid IS NULL OR o.store_id = $1::uuid) AND o.status = 'CAPTURED'
       GROUP BY channel`,
      [storeId]
    );

    const totalGmv = parseFloat(orderStats[0]?.total_gmv || "0");
    const totalOrders = parseInt(orderStats[0]?.total_orders || "0", 10);
    const capturedOrders = parseInt(orderStats[0]?.captured_orders || "0", 10);
    const totalConvs = parseInt(convStats[0]?.total_conversations || "0", 10);
    const closedDeals = parseInt(convStats[0]?.closed_deals || "0", 10);
    const convRate = totalConvs > 0
      ? Number(((closedDeals / totalConvs) * 100).toFixed(1))
      : (totalOrders > 0 ? Number(((capturedOrders / totalOrders) * 100).toFixed(1)) : 0);
    const avgOrderVal = Math.round(parseFloat(orderStats[0]?.avg_order_value || "0"));
    const totalDiscountGiven = parseFloat(orderStats[0]?.total_discount_given || "0");
    const avgDiscount = totalGmv > 0 ? Number(((totalDiscountGiven / (totalGmv + totalDiscountGiven)) * 100).toFixed(1)) : 0;

    const { rows: ruleRow } = await db.query(
      `SELECT max_discount_percentage FROM negotiation_rules WHERE ($1::uuid IS NULL OR store_id = $1::uuid) LIMIT 1`,
      [storeId]
    );
    const maxDiscountPct = ruleRow[0] && ruleRow[0].max_discount_percentage !== null
      ? parseFloat(ruleRow[0].max_discount_percentage)
      : 0.0;
    const theoreticalMaxDiscount = maxDiscountPct > 0 ? (totalGmv * maxDiscountPct) / 100 : 0;
    const marginPreserved = Math.max(0, Math.round(theoreticalMaxDiscount - totalDiscountGiven));

    const { rows: priorWeekStats } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as prior_gmv
       FROM orders
       WHERE ($1::uuid IS NULL OR store_id = $1::uuid)
         AND status = 'CAPTURED'
         AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
         AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'`,
      [storeId]
    );
    const priorGmv = parseFloat(priorWeekStats[0]?.prior_gmv || "0");
    const gmvGrowthPercent = priorGmv > 0
      ? Number((((totalGmv - priorGmv) / priorGmv) * 100).toFixed(1))
      : 0;

    const formattedTopProducts = topProducts
      .filter((p) => parseInt(p.sales_count, 10) > 0 || parseFloat(p.revenue) > 0)
      .map((p) => ({
        title: p.title,
        salesCount: parseInt(p.sales_count, 10) || 0,
        revenue: parseFloat(p.revenue) || 0,
      }));

    const channelBreakdown = channelRows.map((c) => {
      const gmv = parseFloat(c.gmv);
      const pct = totalGmv > 0 ? Math.round((gmv / totalGmv) * 100) : 0;
      return {
        channel: c.channel,
        percentage: pct,
        gmv,
      };
    });

    return res.json({
      agentGmv: totalGmv,
      gmvGrowthPercent,
      totalConversations: totalConvs,
      dealsClosed: closedDeals,
      conversionRate: convRate,
      averageDiscount: avgDiscount,
      averageOrderValue: avgOrderVal,
      marginPreserved,
      totalDiscountGiven,
      topSellingProducts: formattedTopProducts,
      channelBreakdown,
    });
  } catch (err) {
    logger.error({ err }, "Analytics error");
    return res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;
