import { db } from "@zapai/database";
import { getShopifyClient } from "./client.ts";
import { getShopifyConnection } from "./auth.ts";
import { logEvent } from "../../services/audit.ts";
import { logger } from "../../core/logger/index.ts";

export interface ShopifyOrderCreationParams {
  storeId: string;
  orderId: string; // Database UUID or ORD-xxxx
  orderReferenceId?: string; // e.g. "ORD-1042"
  amount: number; // Negotiated agreed price in rupees
  originalPrice?: number;
  discountApplied?: number;
  productTitle?: string;
  sku?: string;
  shopifyVariantId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  x402TxHash?: string;
  currency?: string;
}

export interface ShopifyOrderResult {
  success: boolean;
  shopifyOrderId?: string;
  shopifyOrderNumber?: string;
  shopifyOrderName?: string;
  error?: string;
}

export async function createShopifyOrder(
  params: ShopifyOrderCreationParams
): Promise<ShopifyOrderResult> {
  const { storeId } = params;

  try {
    const conn = await getShopifyConnection(storeId);
    if (!conn || !conn.accessToken || !conn.shopDomain) {
      logger.warn({ storeId }, "Skipping Shopify order creation: No connected Shopify store");
      return { success: false, error: "No Shopify connection configured" };
    }

    if (conn.status === "disconnected") {
      logger.warn({ storeId }, "Skipping Shopify order creation: Store is disconnected");
      return { success: false, error: "Shopify store is disconnected" };
    }

    // Resolve variant ID from SKU or product if not provided
    let variantId = params.shopifyVariantId;
    if (!variantId && (params.sku || params.productTitle)) {
      const { rows: prodRows } = await db.query(
        `SELECT shopify_variant_id FROM products
         WHERE store_id = $1 AND (sku = $2 OR title = $3)
         LIMIT 1`,
        [storeId, params.sku, params.productTitle]
      );
      if (prodRows[0]?.shopify_variant_id) {
        variantId = prodRows[0].shopify_variant_id;
      }
    }

    const client = getShopifyClient(conn.shopDomain, conn.accessToken);

    const names = (params.customerName || "Aarav Patel").trim().split(" ");
    const firstName = names[0] || "Valued";
    const lastName = names.slice(1).join(" ") || "Customer";

    const lineItem: any = {
      title: params.productTitle || "Autonomous AI Product",
      price: params.amount.toFixed(2),
      quantity: 1,
    };

    if (params.sku) {
      lineItem.sku = params.sku;
    }

    if (variantId && !isNaN(Number(variantId))) {
      lineItem.variant_id = parseInt(variantId, 10);
    }

    const payload: any = {
      order: {
        line_items: [lineItem],
        customer: {
          first_name: firstName,
          last_name: lastName,
          phone: params.customerPhone || undefined,
          email: params.customerEmail || undefined,
        },
        financial_status: "paid",
        transactions: [
          {
            kind: "sale",
            status: "success",
            amount: params.amount.toFixed(2),
            gateway: "Razorpay (ZapAI Agent)",
            authorization: params.razorpayPaymentId || "rzp_auto_settled",
          },
        ],
        note: `Created autonomously by ZapAI Agent.\n• Razorpay Payment: ${params.razorpayPaymentId || "N/A"}\n• x402 Tx: ${params.x402TxHash || "N/A"}\n• Internal Ref: ${params.orderReferenceId || params.orderId}`,
        tags: "ZapAI, Agentic-Commerce, Razorpay-Paid, Autonomous-Deal",
        currency: params.currency || conn.currency || "INR",
        send_receipt: true,
      },
    };

    const res = await client.post("/orders.json", payload);

    if (res.status === 201 && res.data?.order) {
      const created = res.data.order;
      const shopifyOrderId = String(created.id);
      const shopifyOrderNumber = String(created.order_number || created.number || "");
      const shopifyOrderName = created.name || `#${shopifyOrderNumber}`;

      // Update database orders table with Shopify order reference
      await db.query(
        `UPDATE orders
         SET
           shopify_order_id = $1,
           shopify_order_number = $2,
           updated_at = NOW()
         WHERE id::text = $3 OR order_id = $3 OR razorpay_payment_id = $4`,
        [shopifyOrderId, shopifyOrderName, params.orderId, params.razorpayPaymentId]
      );

      // Log 5-Way Audit Ledger event
      await logEvent(
        "SHOPIFY_ORDER_CREATED",
        {
          x402TransactionId: params.x402TxHash || `x402_${Date.now()}`,
          razorpayPaymentId: params.razorpayPaymentId || "pay_demo",
          orderId: params.orderReferenceId || params.orderId,
          storeId,
        },
        {
          shopifyOrderId,
          shopifyOrderNumber: shopifyOrderName,
          shopDomain: conn.shopDomain,
          amount: params.amount,
          currency: params.currency || "INR",
          customerName: params.customerName,
          customerPhone: params.customerPhone,
          timestamp: new Date().toISOString(),
        }
      );

      logger.info(
        { shopifyOrderId, shopifyOrderName, storeId, orderId: params.orderId },
        "✅ Shopify order created successfully"
      );

      return {
        success: true,
        shopifyOrderId,
        shopifyOrderNumber,
        shopifyOrderName,
      };
    }

    return {
      success: false,
      error: "Unexpected response from Shopify API",
    };
  } catch (err: any) {
    const errMsg = err.response?.data?.errors
      ? JSON.stringify(err.response.data.errors)
      : err.message;

    logger.error({ err: errMsg, storeId, orderId: params.orderId }, "⚠️ Failed to create Shopify order");

    return {
      success: false,
      error: errMsg,
    };
  }
}
