import { Router } from "express";
import { verifyWebhookSignature } from "../../integrations/razorpay/index.ts";
import { releaseLock } from "../../integrations/redis/index.ts";
import { setInventoryState } from "../../services/merchant.ts";
import { logEvent } from "../../services/audit.ts";
import { sendConfirmation, sendPaymentFailedWithRetry } from "../../integrations/whatsapp/index.ts";
import { db } from "@zapai/database";
import type { RazorpayWebhookPayload, RazorpayPaymentEntity } from "@zapai/types";
import { logger } from "../../core/logger/index.ts";

const router = Router();

router.post("/", async (req, res) => {
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-razorpay-signature"] as string | undefined;

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    logger.warn("⚠️ Invalid Razorpay webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const eventType = body.event;
  const payment = body.payload?.payment?.entity;

  if (!payment) {
    return res.status(200).json({ status: "ignored" });
  }

  const eventId = `${eventType}_${payment.id}`;
  const { rows: existing } = await db.query(
    "SELECT payment_event_id FROM processed_webhook_events WHERE payment_event_id = $1",
    [eventId]
  );

  if (existing.length > 0) {
    logger.info({ eventId }, "ℹ️ Duplicate webhook — already processed, skipping");
    return res.status(200).json({ status: "already_processed" });
  }

  logger.info({ eventType, paymentId: payment.id }, "📥 Razorpay webhook received");

  if (eventType === "payment.captured") {
    await handlePaymentCaptured(payment);
  } else if (eventType === "payment.failed") {
    await handlePaymentFailed(payment);
  }

  await db.query(
    "INSERT INTO processed_webhook_events (payment_event_id, event_type) VALUES ($1, $2)",
    [eventId, eventType]
  );

  return res.status(200).json({ status: "processed" });
});

async function handlePaymentCaptured(
  payment: RazorpayPaymentEntity
): Promise<void> {
  const refId = payment.notes?.reference_id || payment.notes?.order_id;

  const { rows: orderRows } = await db.query(
    `SELECT o.*, s.name as store_name
     FROM orders o
     JOIN stores s ON o.store_id = s.id
     WHERE (o.razorpay_order_id = $1 AND $1 IS NOT NULL)
        OR (o.order_id = $2 AND $2 IS NOT NULL)
     ORDER BY o.created_at DESC LIMIT 1`,
    [payment.order_id, refId]
  );

  if (!orderRows[0]) {
    logger.warn({ orderId: payment.order_id, refId }, "Order not found for Razorpay order");
    return;
  }

  const order = orderRows[0];

  await db.query(
    `UPDATE orders SET razorpay_payment_id = $1, status = 'CAPTURED', updated_at = NOW()
     WHERE id = $2`,
    [payment.id, order.id]
  );

  const qtyMatch = order.product_title?.match(/^(\d+)x\s+/);
  const paidQty = payment.notes?.quantity ? parseInt(payment.notes.quantity, 10) : (qtyMatch ? parseInt(qtyMatch[1], 10) : 1);

  const notesProductId = payment.notes?.product_id;
  const cleanTitle = order.product_title?.replace(/^\d+x\s+/, "");

  const { rows: productRows } = await db.query(
    `SELECT id, shopify_variant_id, store_id, title
     FROM products
     WHERE store_id = $4
       AND (
         id = $1
         OR (sku = $2 AND $2 != '')
         OR (title = $3 AND $3 != '')
       )
     LIMIT 1`,
    [notesProductId || null, order.sku || null, cleanTitle || null, order.store_id]
  );

  for (const product of productRows) {
    // Permanently deduct inventory_available and clear the reservation
    await db.query(
      `UPDATE products
       SET inventory_available = GREATEST(0, inventory_available - $1),
           inventory_reserved  = GREATEST(0, inventory_reserved - $1),
           inventory_state     = CASE WHEN GREATEST(0, inventory_available - $1) <= 0 THEN 'SOLD' ELSE 'AVAILABLE' END,
           reservation_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [paidQty, product.id]
    );

    if (product.shopify_variant_id) {
      await releaseLock(order.store_id, product.shopify_variant_id);
    }
  }

  await logEvent(
    "PAYMENT_CAPTURED",
    {
      x402TransactionId: order.x402_tx_hash,
      razorpayPaymentId: payment.id,
      orderId: order.order_id,
    },
    {
      razorpayOrderId: payment.order_id,
      amount: payment.amount,
      storeId: order.store_id,
      mandateId: order.mandate_id,
    }
  );

  const phoneNumber = payment.notes?.phone_number;
  const conversationId = payment.notes?.conversation_id;

  if (phoneNumber) {
    const { rows: convRows } = conversationId
      ? await db.query(
          `SELECT last_message_id FROM conversations WHERE conversation_id = $1 LIMIT 1`,
          [conversationId]
        )
      : await db.query(
          `SELECT last_message_id FROM conversations WHERE phone_number = $1 ORDER BY updated_at DESC LIMIT 1`,
          [phoneNumber]
        );

    await sendConfirmation(phoneNumber, {
      whatsappMessageId: convRows[0]?.last_message_id ?? "",
      conversationId: conversationId ?? "",
      x402TransactionId: order.x402_tx_hash,
      razorpayPaymentId: payment.id,
      orderId: order.order_id,
      amount: payment.amount / 100,
      storeName: order.store_name,
    });
  } else {
    const { rows: convRows } = await db.query(
      `SELECT phone_number, conversation_id, last_message_id FROM conversations ORDER BY updated_at DESC LIMIT 1`
    );
    if (convRows[0]) {
      await sendConfirmation(convRows[0].phone_number, {
        whatsappMessageId: convRows[0].last_message_id ?? "",
        conversationId: convRows[0].conversation_id,
        x402TransactionId: order.x402_tx_hash,
        razorpayPaymentId: payment.id,
        orderId: order.order_id,
        amount: payment.amount / 100,
        storeName: order.store_name,
      });
    }
  }

  logger.info({ orderId: order.order_id, amount: payment.amount / 100 }, "✅ Payment captured");
}

async function handlePaymentFailed(
  payment: RazorpayPaymentEntity
): Promise<void> {
  const { rows: orderRows } = await db.query(
    "SELECT * FROM orders WHERE razorpay_order_id = $1",
    [payment.order_id]
  );

  if (!orderRows[0]) return;
  const order = orderRows[0];

  await db.query(
    "UPDATE orders SET status = 'FAILED', updated_at = NOW() WHERE razorpay_order_id = $1",
    [payment.order_id]
  );

  const notesProductId = payment.notes?.product_id;
  const failProductQuery = notesProductId
    ? "SELECT id, shopify_variant_id FROM products WHERE id = $1 AND inventory_state = 'PAYMENT_PENDING'"
    : "SELECT id, shopify_variant_id FROM products WHERE store_id = $1 AND inventory_state = 'PAYMENT_PENDING'";
  const failProductParam = notesProductId ?? order.store_id;

  const { rows: productRows } = await db.query(failProductQuery, [failProductParam]);

  for (const product of productRows) {
    await setInventoryState(product.id, "AVAILABLE", {
      reservedDelta: -1,
      clearExpiry: true,
    });

    if (product.shopify_variant_id) {
      await releaseLock(order.store_id, product.shopify_variant_id);
    }
  }

  await logEvent(
    "PAYMENT_FAILED",
    {
      x402TransactionId: order.x402_tx_hash,
      razorpayPaymentId: payment.id,
      orderId: order.order_id,
    },
    {
      reason: payment.error_code,
      description: payment.error_description,
      storeId: order.store_id,
    }
  );

  const failPhoneNumber = payment.notes?.phone_number;
  if (failPhoneNumber) {
    await sendPaymentFailedWithRetry(failPhoneNumber, payment.amount / 100, 90);
  } else {
    const { rows: convRows } = await db.query(
      "SELECT phone_number FROM conversations ORDER BY updated_at DESC LIMIT 1"
    );
    if (convRows[0]) {
      await sendPaymentFailedWithRetry(convRows[0].phone_number, payment.amount / 100, 90);
    }
  }

  logger.info({ orderId: order.order_id }, "❌ Payment failed — lock released, inventory restored");
}

export default router;
