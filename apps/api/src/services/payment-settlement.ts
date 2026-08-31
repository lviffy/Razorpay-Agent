import { db } from "@zapai/database";
import { releaseLock } from "../integrations/redis/index.ts";
import { setInventoryState } from "./merchant.ts";
import { logEvent } from "./audit.ts";
import { sendConfirmation } from "../integrations/whatsapp/index.ts";
import { createShopifyOrder } from "../integrations/shopify/index.ts";
import { logger } from "../core/logger/index.ts";

export async function processOrderPaymentSuccess(opts: {
  orderReferenceId?: string; // e.g. "ORD-9538"
  razorpayOrderId?: string;
  razorpayPaymentId: string;
  amount?: number;
}): Promise<any> {
  const { orderReferenceId, razorpayOrderId, razorpayPaymentId } = opts;

  // Find order
  let orderQuery = "";
  let orderParam = "";
  if (orderReferenceId) {
    orderQuery = `SELECT o.*, s.name as store_name FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.order_id = $1 LIMIT 1`;
    orderParam = orderReferenceId;
  } else if (razorpayOrderId) {
    orderQuery = `SELECT o.*, s.name as store_name FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.razorpay_order_id = $1 LIMIT 1`;
    orderParam = razorpayOrderId;
  } else {
    orderQuery = `SELECT o.*, s.name as store_name FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.razorpay_payment_id = $1 LIMIT 1`;
    orderParam = razorpayPaymentId;
  }

  const { rows: orderRows } = await db.query(orderQuery, [orderParam]);
  if (!orderRows[0]) {
    logger.warn({ opts }, "[PaymentSettlement] Order not found for settlement");
    return null;
  }

  const order = orderRows[0];

  if (order.status === "CAPTURED") {
    logger.info({ orderId: order.order_id }, "[PaymentSettlement] Order is already CAPTURED");
    return order;
  }

  // 1. Update order status
  await db.query(
    `UPDATE orders
     SET razorpay_payment_id = $1, status = 'CAPTURED', updated_at = NOW()
     WHERE id = $2`,
    [razorpayPaymentId, order.id]
  );

  // 2. Find product & update inventory to PAID
  const { rows: productRows } = await db.query(
    `SELECT id, shopify_variant_id FROM products WHERE store_id = $1 AND inventory_state IN ('RESERVED', 'PAYMENT_PENDING', 'AVAILABLE') LIMIT 1`,
    [order.store_id]
  );

  for (const prod of productRows) {
    await setInventoryState(prod.id, "PAID", { reservedDelta: -1 });
    if (prod.shopify_variant_id) {
      await releaseLock(order.store_id, prod.shopify_variant_id);
    }
  }

  // 3. Mark session as PAID
  if (order.session_id) {
    await db.query(
      `UPDATE negotiation_sessions SET status = 'PAID', updated_at = NOW() WHERE id = $1`,
      [order.session_id]
    );
  }

  // 4. Log to Audit Ledger
  const auditIds = {
    x402TransactionId: order.x402_tx_hash || `x402_settle_${order.id}`,
    razorpayPaymentId: razorpayPaymentId,
    orderId: order.order_id || order.id,
    storeId: order.store_id,
  };

  await logEvent("PAYMENT_CAPTURED", auditIds, {
    razorpay_payment_id: razorpayPaymentId,
    razorpay_order_id: order.razorpay_order_id,
    amount: order.amount,
    currency: order.currency || "INR",
    status: "CAPTURED",
    timestamp: new Date().toISOString(),
  });

  // 5. Send WhatsApp confirmation if phone number is available
  try {
    const { rows: convRows } = await db.query(
      `SELECT phone_number, conversation_id FROM conversations WHERE store_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [order.store_id]
    );

    const buyerPhone = convRows[0]?.phone_number || process.env.DEMO_BUYER_PHONE || "+919876543210";

    await sendConfirmation(buyerPhone, {
      whatsappMessageId: `msg_conf_${Date.now()}`,
      conversationId: convRows[0]?.conversation_id || `conv_${buyerPhone}`,
      x402TransactionId: order.x402_tx_hash || "x402_live",
      razorpayPaymentId: razorpayPaymentId,
      orderId: order.order_id || "ORD-COMPLETED",
      amount: parseFloat(order.amount),
      storeName: order.store_name || "ZapAI Merchant Store",
    });
  } catch (err: any) {
    logger.warn({ err: err.message }, "⚠️ WhatsApp confirmation dispatch failed");
  }

  // 6. Post-settlement: Outbound Shopify Order creation (Non-blocking & resilient)
  setImmediate(async () => {
    try {
      await createShopifyOrder({
        storeId: order.store_id,
        orderId: order.id,
        orderReferenceId: order.order_id,
        amount: parseFloat(order.amount),
        originalPrice: order.original_price ? parseFloat(order.original_price) : undefined,
        discountApplied: order.discount_applied ? parseFloat(order.discount_applied) : 0,
        productTitle: order.product_title,
        sku: order.sku,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        razorpayPaymentId: razorpayPaymentId,
        razorpayOrderId: order.razorpay_order_id,
        x402TxHash: order.x402_tx_hash,
        currency: order.currency || "INR",
      });
    } catch (err: any) {
      logger.warn({ err: err.message, orderId: order.order_id }, "⚠️ Async Shopify order creation failed (safe fallback)");
    }
  });

  logger.info({ orderId: order.order_id, paymentId: razorpayPaymentId }, "✅ [PaymentSettlement] Payment settled and order captured");
  return order;
}
