import { NextRequest, NextResponse } from "next/server";
import { db } from "@zapai/database";

export async function GET(req: NextRequest) {
  try {
    const rawStoreId = req.headers.get("x-store-id") || req.nextUrl.searchParams.get("storeId");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const storeId = rawStoreId && uuidRegex.test(rawStoreId) ? rawStoreId : null;

    if (!storeId) {
      return NextResponse.json({
        agentGmv: 0,
        gmvGrowthPercent: 0,
        totalConversations: 0,
        dealsClosed: 0,
        conversionRate: 0,
        averageDiscount: 0,
        averageOrderValue: 0,
        marginPreserved: 0,
        topSellingProducts: [],
        channelBreakdown: [],
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
        COUNT(CASE WHEN status = 'deal_closed' THEN 1 END) as closed_deals
       FROM conversations
       WHERE store_id = $1::uuid`,
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
      `SELECT max_discount_percentage FROM negotiation_rules WHERE store_id = $1::uuid LIMIT 1`,
      [storeId]
    );
    const maxDiscountPct = ruleRow[0]?.max_discount_percentage !== null
      ? parseFloat(ruleRow[0]?.max_discount_percentage || "12")
      : 12.0;

    const theoreticalMaxDiscount = maxDiscountPct > 0 ? (totalGmv * maxDiscountPct) / 100 : 0;
    const marginPreserved = Math.max(0, Math.round(theoreticalMaxDiscount - totalDiscountGiven));

    return NextResponse.json({
      agentGmv: totalGmv,
      gmvGrowthPercent: 0,
      totalConversations: totalConvs,
      dealsClosed: capturedOrders,
      conversionRate: convRate,
      averageDiscount: avgDiscount,
      averageOrderValue: avgOrderVal,
      marginPreserved,
      topSellingProducts: [],
      channelBreakdown: [
        {
          channel: "ZapAI Native Catalog",
          orderCount: capturedOrders,
          gmv: totalGmv,
        },
      ],
    });
  } catch (err: any) {
    console.error("[Analytics Route Error]:", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
