import { db } from "@zapai/database";
import { logger } from "../../core/logger/index.ts";

export interface ToolContext {
  storeId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tool Function Declarations (Gemini Schema)
// ─────────────────────────────────────────────────────────────────────────────

export const growthAIFunctionDeclarations: any[] = [
  {
    name: "getStoreSummaryMetrics",
    description:
      "Fetches high-level financial and growth metrics for the merchant store, including Total GMV, Captured Orders, Average Order Value (AOV), Total Discounts Conceded, Dealer Margin Preserved, and WhatsApp Lead-to-Deal Conversion Rate.",
    parameters: {
      type: "OBJECT",
      properties: {
        timeframe: {
          type: "STRING",
          description: "Time window for metrics: 'today', '7d', '14d', '30d', or 'all'. Default is 'all'.",
        },
      },
    },
  },
  {
    name: "getInventoryHealthMetrics",
    description:
      "Analyzes the live product catalog stock levels, inventory burn rate, days of inventory remaining (DOI), stockout risk status (CRITICAL, LOW, HEALTHY, DEAD_STOCK), and floor pricing elasticity.",
    parameters: {
      type: "OBJECT",
      properties: {
        filterStatus: {
          type: "STRING",
          description: "Optional filter for stock status: 'ALL', 'CRITICAL', 'LOW', 'DEAD_STOCK', or 'HEALTHY'.",
        },
      },
    },
  },
  {
    name: "getProductPerformance",
    description:
      "Returns granular performance metrics for each product SKU, including units sold, revenue generated, average discount applied, and margin profitability.",
    parameters: {
      type: "OBJECT",
      properties: {
        sortBy: {
          type: "STRING",
          description: "Sort metric: 'revenue', 'sales_count', or 'velocity'. Default is 'revenue'.",
        },
        limit: {
          type: "NUMBER",
          description: "Max number of products to return (default: 10).",
        },
      },
    },
  },
  {
    name: "getNegotiationTrends",
    description:
      "Analyzes autonomous WhatsApp buyer conversations and A2A negotiations to identify buyer discount expectations, price rejection points, deal closing velocity, and conversation drop-offs.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: {
          type: "NUMBER",
          description: "Number of recent conversation sessions to inspect (default: 15).",
        },
      },
    },
  },
  {
    name: "executeStoreAction",
    description:
      "Executes or generates an actionable modification for the store, such as updating a product's floor price, adjusting listed price, updating stock quantity, or changing discount rules.",
    parameters: {
      type: "OBJECT",
      properties: {
        actionType: {
          type: "STRING",
          description: "The type of action: 'UPDATE_FLOOR_PRICE', 'UPDATE_LISTED_PRICE', 'RESTOCK_INVENTORY', or 'UPDATE_MAX_DISCOUNT'.",
        },
        sku: {
          type: "STRING",
          description: "Product SKU (required for product-level actions).",
        },
        value: {
          type: "NUMBER",
          description: "The new numeric value (e.g., new price in INR, added stock quantity, or max discount percentage).",
        },
      },
      required: ["actionType", "value"],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Tool Implementations (Live Postgres Queries)
// ─────────────────────────────────────────────────────────────────────────────

export async function executeToolCall(
  name: string,
  args: any,
  context: ToolContext
): Promise<any> {
  const storeId = context.storeId;

  try {
    switch (name) {
      case "getStoreSummaryMetrics": {
        const timeframe = args?.timeframe || "all";
        let timeCondition = "";
        if (timeframe === "today") timeCondition = "AND created_at >= CURRENT_DATE";
        else if (timeframe === "7d") timeCondition = "AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'";
        else if (timeframe === "14d") timeCondition = "AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'";
        else if (timeframe === "30d") timeCondition = "AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'";

        const { rows: orderStats } = await db.query(
          `SELECT
            COALESCE(SUM(amount), 0) as total_gmv,
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'CAPTURED' THEN 1 END) as captured_orders,
            COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_orders,
            COALESCE(AVG(CASE WHEN status = 'CAPTURED' THEN amount END), 0) as avg_order_value,
            COALESCE(SUM(discount_applied), 0) as total_discount_given,
            COALESCE(SUM(original_price), 0) as total_original_value
           FROM orders
           WHERE ($1::uuid IS NULL OR store_id = $1::uuid) ${timeCondition}`,
          [storeId]
        );

        const { rows: convStats } = await db.query(
          `SELECT
            COUNT(*) as total_conversations,
            COUNT(CASE WHEN status = 'deal_closed' THEN 1 END) as closed_deals,
            COUNT(CASE WHEN status = 'negotiating' THEN 1 END) as active_negotiations,
            COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated_to_human
           FROM conversations
           WHERE ($1::uuid IS NULL OR store_id = $1::uuid) ${timeCondition}`,
          [storeId]
        );

        const { rows: ruleRow } = await db.query(
          `SELECT max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, risk_profile
           FROM negotiation_rules
           WHERE ($1::uuid IS NULL OR store_id = $1::uuid)
           LIMIT 1`,
          [storeId]
        );

        const totalGmv = parseFloat(orderStats[0]?.total_gmv || "0");
        const capturedOrders = parseInt(orderStats[0]?.captured_orders || "0", 10);
        const totalConvs = parseInt(convStats[0]?.total_conversations || "0", 10);
        const closedDeals = parseInt(convStats[0]?.closed_deals || "0", 10);
        const convRate = totalConvs > 0 ? Number(((closedDeals / totalConvs) * 100).toFixed(1)) : 0;
        const avgOrderVal = Math.round(parseFloat(orderStats[0]?.avg_order_value || "0"));
        const totalDiscountGiven = parseFloat(orderStats[0]?.total_discount_given || "0");

        const maxDiscountPct = ruleRow[0]?.max_discount_percentage !== null
          ? parseFloat(ruleRow[0]?.max_discount_percentage || "12")
          : 12.0;

        const maxAllowableDiscount = (totalGmv * maxDiscountPct) / 100;
        const marginPreserved = Math.max(0, Math.round(maxAllowableDiscount - totalDiscountGiven));

        return {
          timeframe,
          currency: "INR",
          totalGmv: Math.round(totalGmv),
          capturedOrders,
          failedOrders: parseInt(orderStats[0]?.failed_orders || "0", 10),
          averageOrderValue: avgOrderVal,
          totalDiscountGiven: Math.round(totalDiscountGiven),
          marginPreservedINR: marginPreserved,
          averageDiscountPercent: totalGmv > 0 ? Number(((totalDiscountGiven / (totalGmv + totalDiscountGiven)) * 100).toFixed(1)) : 0,
          totalConversations: totalConvs,
          closedDeals,
          conversionRatePercent: convRate,
          activeNegotiations: parseInt(convStats[0]?.active_negotiations || "0", 10),
          escalatedToHuman: parseInt(convStats[0]?.escalated_to_human || "0", 10),
          negotiationRule: {
            maxDiscountPercent: maxDiscountPct,
            riskProfile: ruleRow[0]?.risk_profile || "balanced",
            freeShippingThreshold: ruleRow[0]?.free_shipping_threshold ? parseFloat(ruleRow[0].free_shipping_threshold) : null,
          },
        };
      }

      case "getInventoryHealthMetrics": {
        const { rows: products } = await db.query(
          `SELECT
            p.id,
            p.title,
            p.sku,
            p.listed_price,
            p.floor_price,
            p.inventory_available,
            p.inventory_reserved,
            p.inventory_state,
            p.category,
            p.is_ai_enabled,
            COUNT(o.id) as recent_orders,
            COALESCE(SUM(o.amount), 0) as recent_revenue
           FROM products p
           LEFT JOIN orders o ON (o.sku = p.sku OR o.product_title = p.title) 
             AND o.status = 'CAPTURED' 
             AND o.created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
           WHERE ($1::uuid IS NULL OR p.store_id = $1::uuid)
           GROUP BY p.id
           ORDER BY p.inventory_available ASC, recent_revenue DESC`,
          [storeId]
        );

        const healthReports = products.map((p) => {
          const available = parseInt(p.inventory_available, 10) || 0;
          const reserved = parseInt(p.inventory_reserved, 10) || 0;
          const ordersLast14d = parseInt(p.recent_orders, 10) || 0;
          const dailyBurnRate = Number((ordersLast14d / 14).toFixed(2));
          const daysOfInventory = dailyBurnRate > 0 ? Math.round(available / dailyBurnRate) : (available > 0 ? 999 : 0);

          let stockStatus: "OUT_OF_STOCK" | "CRITICAL_LOW" | "LOW_STOCK" | "HEALTHY" | "DEAD_STOCK" = "HEALTHY";
          if (available === 0) {
            stockStatus = "OUT_OF_STOCK";
          } else if (daysOfInventory <= 3 || available <= 2) {
            stockStatus = "CRITICAL_LOW";
          } else if (daysOfInventory <= 7 || available <= 5) {
            stockStatus = "LOW_STOCK";
          } else if (ordersLast14d === 0 && available > 10) {
            stockStatus = "DEAD_STOCK";
          }

          const listedPrice = parseFloat(p.listed_price);
          const floorPrice = parseFloat(p.floor_price);
          const marginCapPercent = listedPrice > 0 ? Number((((listedPrice - floorPrice) / listedPrice) * 100).toFixed(1)) : 0;

          return {
            id: p.id,
            title: p.title,
            sku: p.sku,
            category: p.category,
            listedPrice,
            floorPrice,
            marginCapPercent,
            availableStock: available,
            reservedStock: reserved,
            dailySalesBurnRate: dailyBurnRate,
            daysOfInventoryRemaining: daysOfInventory === 999 ? "30+ days (Stable)" : `${daysOfInventory} days`,
            stockStatus,
            aiEnabled: p.is_ai_enabled ?? true,
            revenueLast14d: parseFloat(p.recent_revenue),
          };
        });

        const filter = args?.filterStatus?.toUpperCase();
        const filtered = filter && filter !== "ALL"
          ? healthReports.filter((h) => h.stockStatus === filter || (filter === "CRITICAL" && (h.stockStatus === "CRITICAL_LOW" || h.stockStatus === "OUT_OF_STOCK")))
          : healthReports;

        const totalSKUs = healthReports.length;
        const criticalCount = healthReports.filter((h) => h.stockStatus === "CRITICAL_LOW" || h.stockStatus === "OUT_OF_STOCK").length;
        const lowCount = healthReports.filter((h) => h.stockStatus === "LOW_STOCK").length;
        const deadStockCount = healthReports.filter((h) => h.stockStatus === "DEAD_STOCK").length;

        return {
          totalCatalogSKUs: totalSKUs,
          summary: {
            criticalStockoutRisks: criticalCount,
            lowStockWarnings: lowCount,
            deadStockAlerts: deadStockCount,
            healthyStockCount: totalSKUs - (criticalCount + lowCount + deadStockCount),
          },
          products: filtered,
        };
      }

      case "getProductPerformance": {
        const limit = args?.limit || 10;
        const sortBy = args?.sortBy || "revenue";

        let orderClause = "ORDER BY total_revenue DESC";
        if (sortBy === "sales_count") orderClause = "ORDER BY units_sold DESC";
        else if (sortBy === "velocity") orderClause = "ORDER BY units_sold DESC, total_revenue DESC";

        const { rows } = await db.query(
          `SELECT
            p.id,
            p.title,
            p.sku,
            p.category,
            p.listed_price,
            p.floor_price,
            p.inventory_available,
            COUNT(o.id) as units_sold,
            COALESCE(SUM(o.amount), 0) as total_revenue,
            COALESCE(SUM(o.discount_applied), 0) as total_discounts_given,
            COALESCE(AVG(o.amount), 0) as avg_realized_price
           FROM products p
           LEFT JOIN orders o ON (o.sku = p.sku OR o.product_title = p.title) AND o.status = 'CAPTURED'
           WHERE ($1::uuid IS NULL OR p.store_id = $1::uuid)
           GROUP BY p.id
           ${orderClause}
           LIMIT $2`,
          [storeId, limit]
        );

        const items = rows.map((r) => {
          const rev = parseFloat(r.total_revenue);
          const disc = parseFloat(r.total_discounts_given);
          const listed = parseFloat(r.listed_price);
          const floor = parseFloat(r.floor_price);
          const units = parseInt(r.units_sold, 10);
          const avgRealized = Math.round(parseFloat(r.avg_realized_price));
          const discountPct = (rev + disc) > 0 ? Number(((disc / (rev + disc)) * 100).toFixed(1)) : 0;

          return {
            title: r.title,
            sku: r.sku,
            category: r.category,
            listedPrice: listed,
            floorPrice: floor,
            availableStock: parseInt(r.inventory_available, 10),
            unitsSold: units,
            totalRevenueINR: Math.round(rev),
            averageRealizedPrice: avgRealized,
            averageDiscountConcededPercent: discountPct,
            profitProtectionScore: floor > 0 && avgRealized >= floor ? "100% Floor Preserved" : "Margin Alert",
          };
        });

        return {
          totalAnalyzed: items.length,
          topProducts: items,
        };
      }

      case "getNegotiationTrends": {
        const limit = args?.limit || 15;
        const { rows } = await db.query(
          `SELECT
            c.id,
            c.customer_name,
            c.phone_number,
            c.session_state,
            c.status,
            c.deal_amount,
            c.products_discussed,
            c.context,
            c.created_at
           FROM conversations c
           WHERE ($1::uuid IS NULL OR c.store_id = $1::uuid)
           ORDER BY c.created_at DESC
           LIMIT $2`,
          [storeId, limit]
        );

        let totalDeals = 0;
        let successfulDeals = 0;
        let discountCount = 0;

        const sessions = rows.map((r) => {
          if (r.status === "deal_closed") successfulDeals++;
          totalDeals++;

          return {
            id: r.id,
            customerName: r.customer_name,
            status: r.status,
            dealAmount: r.deal_amount ? parseFloat(r.deal_amount) : null,
            productsDiscussed: r.products_discussed,
            createdAt: r.created_at,
          };
        });

        return {
          inspectedConversations: totalDeals,
          closedRate: totalDeals > 0 ? `${Math.round((successfulDeals / totalDeals) * 100)}%` : "0%",
          recentSessions: sessions,
        };
      }

      case "executeStoreAction": {
        const { actionType, sku, value } = args;

        if (actionType === "UPDATE_FLOOR_PRICE") {
          if (!sku || value === undefined) throw new Error("SKU and new floor price value are required");
          const { rows } = await db.query(
            `UPDATE products 
             SET floor_price = $1, updated_at = NOW() 
             WHERE sku = $2 AND ($3::uuid IS NULL OR store_id = $3::uuid)
             RETURNING id, title, sku, listed_price, floor_price`,
            [value, sku, storeId]
          );
          if (!rows[0]) throw new Error(`Product SKU '${sku}' not found.`);
          return {
            success: true,
            action: "UPDATE_FLOOR_PRICE",
            product: rows[0],
            message: `Updated floor price for ${rows[0].title} (${sku}) to ₹${value.toLocaleString("en-IN")}.`,
          };
        }

        if (actionType === "UPDATE_LISTED_PRICE") {
          if (!sku || value === undefined) throw new Error("SKU and new listed price value are required");
          const { rows } = await db.query(
            `UPDATE products 
             SET listed_price = $1, updated_at = NOW() 
             WHERE sku = $2 AND ($3::uuid IS NULL OR store_id = $3::uuid)
             RETURNING id, title, sku, listed_price, floor_price`,
            [value, sku, storeId]
          );
          if (!rows[0]) throw new Error(`Product SKU '${sku}' not found.`);
          return {
            success: true,
            action: "UPDATE_LISTED_PRICE",
            product: rows[0],
            message: `Updated listed price for ${rows[0].title} (${sku}) to ₹${value.toLocaleString("en-IN")}.`,
          };
        }

        if (actionType === "RESTOCK_INVENTORY") {
          if (!sku || value === undefined) throw new Error("SKU and quantity are required");
          const { rows } = await db.query(
            `UPDATE products 
             SET inventory_available = inventory_available + $1, 
                 inventory_state = 'AVAILABLE',
                 updated_at = NOW() 
             WHERE sku = $2 AND ($3::uuid IS NULL OR store_id = $3::uuid)
             RETURNING id, title, sku, inventory_available`,
            [value, sku, storeId]
          );
          if (!rows[0]) throw new Error(`Product SKU '${sku}' not found.`);
          return {
            success: true,
            action: "RESTOCK_INVENTORY",
            product: rows[0],
            message: `Restocked ${value} units of ${rows[0].title} (${sku}). New available stock: ${rows[0].inventory_available}.`,
          };
        }

        if (actionType === "UPDATE_MAX_DISCOUNT") {
          if (value === undefined) throw new Error("Max discount percentage is required");
          const { rows } = await db.query(
            `UPDATE negotiation_rules 
             SET max_discount_percentage = $1 
             WHERE ($2::uuid IS NULL OR store_id = $2::uuid)
             RETURNING max_discount_percentage`,
            [value, storeId]
          );
          return {
            success: true,
            action: "UPDATE_MAX_DISCOUNT",
            message: `Updated maximum allowable discount to ${value}%.`,
          };
        }

        throw new Error(`Unknown action type: ${actionType}`);
      }

      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  } catch (err: any) {
    logger.error({ err, tool: name, args }, "Tool execution error in Growth AI");
    return { error: err?.message || "Failed to execute tool" };
  }
}
