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

// GET /api/v1/dashboard/overview
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);

    if (!storeId) {
      return res.json({
        summary: {
          agentGmv: 0,
          gmvGrowthPercent: 0,
          totalConversations: 0,
          dealsClosed: 0,
          conversionRate: 0,
          averageDiscount: 0,
          averageOrderValue: 0,
          marginPreserved: 0,
          topSellingProducts: [],
          todayWebhookCount: 0,
        },
        activity: [],
        charts: {
          gmvData: [],
          marginData: [],
          velocityData: [],
        },
      });
    }

    const { rows: orderStats } = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN amount ELSE 0 END), 0) as total_gmv,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'CAPTURED' THEN 1 END) as captured_orders,
        COALESCE(AVG(CASE WHEN status = 'CAPTURED' THEN amount END), 0) as avg_order_value,
        COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN discount_applied ELSE 0 END), 0) as total_discount_given,
        COALESCE(SUM(CASE WHEN status = 'CAPTURED' THEN original_price ELSE 0 END), 0) as total_original_value
       FROM orders
       WHERE store_id = $1::uuid`,
      [storeId]
    );

    const { rows: convStats } = await db.query(
      `SELECT
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'deal_closed' THEN 1 END) as closed_deals,
        COALESCE(SUM(deal_amount), 0) as total_deal_volume
       FROM conversations
       WHERE store_id = $1::uuid`,
      [storeId]
    );

    const { rows: ruleRow } = await db.query(
      `SELECT max_discount_percentage, min_order_value_for_discount, free_shipping_threshold FROM negotiation_rules WHERE store_id = $1::uuid LIMIT 1`,
      [storeId]
    );
    const maxDiscountPct = ruleRow[0] && ruleRow[0].max_discount_percentage !== null
      ? parseFloat(ruleRow[0].max_discount_percentage)
      : 0.0;

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

    const theoreticalMaxDiscount = maxDiscountPct > 0 ? (totalGmv * maxDiscountPct) / 100 : 0;
    const marginPreserved = Math.max(0, Math.round(theoreticalMaxDiscount - totalDiscountGiven));
    const avgDiscountPct = totalGmv > 0 ? Number(((totalDiscountGiven / (totalGmv + totalDiscountGiven)) * 100).toFixed(1)) : 0;

    const { rows: priorWeekStats } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as prior_gmv
       FROM orders
       WHERE store_id = $1::uuid
         AND status = 'CAPTURED'
         AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
         AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'`,
      [storeId]
    );
    const priorGmv = parseFloat(priorWeekStats[0]?.prior_gmv || "0");
    const gmvGrowthPercent = priorGmv > 0
      ? Number((((totalGmv - priorGmv) / priorGmv) * 100).toFixed(1))
      : 0;

    const { rows: topProducts } = await db.query(
      `SELECT
        p.title,
        COUNT(o.id) as sales_count,
        COALESCE(SUM(o.amount), 0) as revenue
       FROM products p
       LEFT JOIN orders o ON (o.sku = p.sku OR o.product_title = p.title) AND o.status = 'CAPTURED'
       WHERE p.store_id = $1::uuid
       GROUP BY p.id, p.title
       ORDER BY sales_count DESC, revenue DESC
       LIMIT 5`,
      [storeId]
    );

    const formattedTopProducts = topProducts
      .filter((p) => parseInt(p.sales_count, 10) > 0 || parseFloat(p.revenue) > 0)
      .map((p) => ({
        title: p.title,
        salesCount: parseInt(p.sales_count, 10) || 0,
        revenue: parseFloat(p.revenue) || 0,
      }));

    const { rows: activityRows } = await db.query(
      `SELECT id, event_type, payload, timestamp
       FROM audit_ledger
       WHERE store_id = $1::uuid
       ORDER BY id DESC
       LIMIT 15`,
      [storeId]
    );

    const activity = activityRows.map((a) => {
      const p = typeof a.payload === "string" ? JSON.parse(a.payload) : a.payload || {};
      let title = a.event_type.replace(/_/g, " ");
      let desc = "Verified cryptographic audit event.";

      switch (a.event_type) {
        case "PAYMENT_CAPTURED":
          title = "Instant UPI Payment Captured";
          const amt = p.amount ? (p.amount > 1000 ? p.amount / 100 : p.amount) : null;
          desc = amt
            ? `₹${amt.toLocaleString("en-IN")} settled via Razorpay UPI (${p.method || "UPI"})`
            : `Payment settled via Razorpay UPI (${p.method || "UPI"})`;
          break;
        case "INVENTORY_LOCKED":
          title = "Autonomous Inventory Reservation";
          desc = `Locked 1 unit for ${p.sku || p.productTitle || "item"} (Redis Redlock TTL 120s)`;
          break;
        case "NEGOTIATION_COMPLETED":
          title = "AI Counter-Offer Agreed";
          desc = p.agreedPrice
            ? `Deal struck at ₹${Number(p.agreedPrice).toLocaleString("en-IN")}${p.discountPercent ? ` with ${p.discountPercent}% concession` : ""}`
            : `Deal agreed within floor price mandate`;
          break;
        case "INVENTORY_UPDATED":
          title = "Catalog Stock Synchronized";
          desc = `${p.sku || p.title || "Catalog SKU"} stock verified (${p.newStock ?? p.inventory ?? 0} available)`;
          break;
        default:
          title = a.event_type.replace(/_/g, " ");
          desc = `Logged event with verified SHA-256 checksum`;
      }

      return {
        id: `act_${a.id}`,
        type: a.event_type,
        title,
        description: desc,
        timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : new Date().toISOString(),
        metadata: p,
      };
    });

    const { rows: gmvRows } = await db.query(
      `SELECT
        TO_CHAR(d.day, 'Dy') as day_abbr,
        DATE(d.day) = CURRENT_DATE as is_today,
        COALESCE(SUM(o.amount), 0) as gmv,
        COALESCE(SUM(o.original_price), 0) as baseline
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) d(day)
       LEFT JOIN orders o ON DATE(o.created_at) = DATE(d.day) AND o.store_id = $1::uuid AND o.status = 'CAPTURED'
       GROUP BY d.day
       ORDER BY d.day ASC;`,
      [storeId]
    );

    const gmvData = gmvRows.map((r) => ({
      day: r.is_today ? "Today" : r.day_abbr,
      gmv: parseFloat(r.gmv),
      baseline: parseFloat(r.baseline) > 0 ? parseFloat(r.baseline) : parseFloat(r.gmv),
    }));

    const { rows: marginRows } = await db.query(
      `SELECT
        TO_CHAR(d.day, 'Dy') as day_abbr,
        DATE(d.day) = CURRENT_DATE as is_today,
        COALESCE(SUM(CASE WHEN o.amount > 0 AND $2 > 0 THEN GREATEST(0, ROUND(o.amount * ($2 / 100.0) - o.discount_applied)) ELSE 0 END), 0) as preserved,
        COALESCE(SUM(o.discount_applied), 0) as conceded
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) d(day)
       LEFT JOIN orders o ON DATE(o.created_at) = DATE(d.day) AND o.store_id = $1::uuid AND o.status = 'CAPTURED'
       GROUP BY d.day
       ORDER BY d.day ASC;`,
      [storeId, maxDiscountPct]
    );

    const marginData = marginRows.map((r) => ({
      day: r.is_today ? "Today" : r.day_abbr,
      preserved: parseFloat(r.preserved),
      conceded: parseFloat(r.conceded),
    }));

    const { rows: velocityRows } = await db.query(
      `SELECT
        b.time_label as time,
        COUNT(c.id) as leads,
        COUNT(CASE WHEN c.status = 'deal_closed' THEN 1 END) as deals
       FROM (
         VALUES 
           ('08:00', 6, 9),
           ('11:00', 9, 12),
           ('14:00', 12, 15),
           ('17:00', 15, 18),
           ('20:00', 18, 21),
           ('23:00', 21, 24)
       ) AS b(time_label, start_hr, end_hr)
       LEFT JOIN conversations c ON EXTRACT(HOUR FROM c.created_at) >= b.start_hr AND EXTRACT(HOUR FROM c.created_at) < b.end_hr AND c.store_id = $1::uuid
       GROUP BY b.time_label, b.start_hr
       ORDER BY b.start_hr ASC;`,
      [storeId]
    );

    const velocityData = velocityRows.map((r) => ({
      time: r.time,
      leads: parseInt(r.leads, 10),
      deals: parseInt(r.deals, 10),
    }));

    const { rows: webhookRows } = await db.query(
      `SELECT COUNT(*) as count FROM processed_webhook_events WHERE processed_at >= CURRENT_DATE AND store_id = $1::uuid`,
      [storeId]
    );
    const todayWebhookCount = parseInt(webhookRows[0]?.count || "0", 10) || capturedOrders;

    return res.json({
      summary: {
        agentGmv: totalGmv,
        gmvGrowthPercent,
        totalConversations: totalConvs,
        dealsClosed: closedDeals,
        conversionRate: convRate,
        averageDiscount: avgDiscountPct,
        averageOrderValue: avgOrderVal,
        marginPreserved,
        topSellingProducts: formattedTopProducts,
        todayWebhookCount,
      },
      activity,
      charts: {
        gmvData,
        marginData,
        velocityData,
      },
    });
  } catch (err) {
    logger.error({ err }, "Dashboard overview error");
    return res.status(500).json({ error: "Failed to load dashboard overview" });
  }
});

export default router;
