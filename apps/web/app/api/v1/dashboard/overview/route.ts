import { NextRequest, NextResponse } from "next/server";
import { db } from "@zapai/database";

export async function GET(req: NextRequest) {
  try {
    const rawStoreId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const storeId = rawStoreId && uuidRegex.test(rawStoreId) ? rawStoreId : null;

    if (!storeId) {
      return NextResponse.json({
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

    // Strictly count ONLY CAPTURED orders for Settled GMV and completed metrics
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
      `SELECT max_discount_percentage FROM negotiation_rules WHERE store_id = $1::uuid LIMIT 1`,
      [storeId]
    );
    const maxDiscountPct = ruleRow[0]?.max_discount_percentage !== null
      ? parseFloat(ruleRow[0]?.max_discount_percentage || "12")
      : 12.0;

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

    return NextResponse.json({
      summary: {
        agentGmv: totalGmv,
        gmvGrowthPercent: 0,
        totalConversations: totalConvs,
        dealsClosed: capturedOrders,
        conversionRate: convRate,
        averageDiscount: avgDiscountPct,
        averageOrderValue: avgOrderVal,
        marginPreserved,
        topSellingProducts: [],
        todayWebhookCount: capturedOrders,
      },
      activity: [],
      charts: {
        gmvData,
        marginData,
        velocityData,
      },
    });
  } catch (err: any) {
    console.error("[Dashboard Overview Route Error]:", err);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
