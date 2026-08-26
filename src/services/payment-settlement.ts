import { db } from "../db/migrate.ts";
import { releaseLock } from "./redis.ts";
import { setInventoryState } from "./merchant.ts";
import { logEvent } from "./audit.ts";
import { sendConfirmation } from "./whatsapp.ts";

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
    console.warn(`[PaymentSettlement] Order not found for:`, opts);
    return null;
  }

  const order = orderRows[0];

  // If already captured, don't duplicate
  if (order.status === "CAPTURED") {
    console.log(`[PaymentSettlement] Order ${order.order_id} is already CAPTURED.`);
    return order;
  }

  // 1. Update order
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

  // 3. Log to cryptographic audit ledger
  await logEvent(
    "PAYMENT_CAPTURED",
    {
      x402TransactionId: order.x402_tx_hash,
      razorpayPaymentId: razorpayPaymentId,
      orderId: order.order_id,
    },
    {
      razorpayOrderId: order.razorpay_order_id,
      amount: parseFloat(order.amount),
      storeId: order.store_id,
      mandateId: order.mandate_id,
    }
  );

  // 4. Send WhatsApp confirmation to buyer
  const { rows: convRows } = await db.query(
    `SELECT phone_number, conversation_id, last_message_id FROM conversations ORDER BY updated_at DESC LIMIT 1`
  );
  const targetPhone = order.customer_phone || convRows[0]?.phone_number;
  if (targetPhone) {
    try {
      await sendConfirmation(targetPhone, {
        whatsappMessageId: convRows[0]?.last_message_id ?? "",
        conversationId: convRows[0]?.conversation_id ?? `conv_${targetPhone}`,
        x402TransactionId: order.x402_tx_hash,
        razorpayPaymentId: razorpayPaymentId,
        orderId: order.order_id,
        amount: parseFloat(order.amount),
        storeName: order.store_name,
      });
      console.log(`[PaymentSettlement] Sent WhatsApp confirmation to ${targetPhone}`);
    } catch (waErr) {
      console.warn(`[PaymentSettlement] WhatsApp confirmation warning:`, waErr);
    }
  }

  console.log(`✅ [PaymentSettlement] Successfully settled Order ${order.order_id} (₹${order.amount})`);
  return { ...order, status: "CAPTURED", razorpay_payment_id: razorpayPaymentId };
}
