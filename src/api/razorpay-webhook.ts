import { Router } from "express";
import { verifyWebhookSignature } from "../services/razorpay.ts";
import { releaseLock } from "../services/redis.ts";
import { setInventoryState, getProductById } from "../services/merchant.ts";
import { logEvent } from "../services/audit.ts";
import { sendConfirmation, sendPaymentFailedWithRetry } from "../services/whatsapp.ts";
import { db } from "../db/migrate.ts";
import type { RazorpayWebhookPayload, RazorpayPaymentEntity } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay Webhook Handler
// Source of truth for all payment state changes.
// Idempotency: processed_webhook_events prevents double-processing on retries.
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

router.post("/", async (req, res) => {
  // Must return 200 quickly — Razorpay retries on failure
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-razorpay-signature"] as string | undefined;

  // Step 1: Verify HMAC-SHA256 signature
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.warn("⚠️  Invalid Razorpay webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const body: RazorpayWebhookPayload = JSON.parse(rawBody.toString());
  const eventType = body.event;
  const payment = body.payload?.payment?.entity;

  if (!payment) {
    return res.status(200).json({ status: "ignored" });
  }

  // Step 2: Idempotency check — deduplicate retried webhooks
  const eventId = `${eventType}_${payment.id}`;
  const { rows: existing } = await db.query(
    "SELECT payment_event_id FROM processed_webhook_events WHERE payment_event_id = $1",
    [eventId]
  );

  if (existing.length > 0) {
    console.log(`ℹ️  Duplicate webhook ${eventId} — already processed, skipping`);
    return res.status(200).json({ status: "already_processed" });
  }

  console.log(`📥 Razorpay webhook: ${eventType} | ${payment.id}`);

  // Step 3: Process event
  if (eventType === "payment.captured") {
    await handlePaymentCaptured(payment);
  } else if (eventType === "payment.failed") {
    await handlePaymentFailed(payment);
  }

  // Step 4: Mark as processed (idempotency)
  await db.query(
    "INSERT INTO processed_webhook_events (payment_event_id, event_type) VALUES ($1, $2)",
    [eventId, eventType]
  );

  return res.status(200).json({ status: "processed" });
});

// ── payment.captured ──────────────────────────────────────────────────────────

async function handlePaymentCaptured(
  payment: RazorpayPaymentEntity
): Promise<void> {
  const refId = payment.notes?.reference_id || payment.notes?.order_id;

  // Find our order by Razorpay order_id OR reference_id (ORD-xxxx)
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
    console.warn(`Order not found for Razorpay order: ${payment.order_id || refId}`);
    return;
  }

  const order = orderRows[0];

  // Update order with payment ID and status
  await db.query(
    `UPDATE orders SET razorpay_payment_id = $1, status = 'CAPTURED', updated_at = NOW()
     WHERE id = $2`,
    [payment.id, order.id]
  );

  // Extract quantity paid (from product_title e.g. "2x Shayanna" or payment notes)
  const qtyMatch = order.product_title?.match(/^(\d+)x\s+/);
  const paidQty = payment.notes?.quantity ? parseInt(payment.notes.quantity, 10) : (qtyMatch ? parseInt(qtyMatch[1], 10) : 1);

  // Find product and finalize inventory deduction
  const notesProductId = payment.notes?.product_id;
  const cleanTitle = order.product_title?.replace(/^\d+x\s+/, "");

  const { rows: productRows } = await db.query(
    `SELECT id, shopify_variant_id, store_id, title
     FROM products
     WHERE id = $1
        OR (sku = $2 AND $2 != '')
        OR (title = $3 AND $3 != '')
     LIMIT 1`,
    [notesProductId || null, order.sku || null, cleanTitle || null]
  );

  for (const product of productRows) {
    // Deduct reservation and clear expiration so stock reduction is permanent
    await setInventoryState(product.id, "PAID", {
      reservedDelta: -paidQty,
      reservationExpiresAt: null,
    });

    // Release Redis lock
    await releaseLock(order.store_id, product.shopify_variant_id);
  }

  // Log to audit ledger
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

  // Route WhatsApp confirmation to the exact buyer via notes — never a global query
  const phoneNumber = payment.notes?.phone_number;
  const conversationId = payment.notes?.conversation_id;

  if (phoneNumber) {
    // Fetch last_message_id for the specific conversation
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
      amount: payment.amount / 100, // paise → rupees
      storeName: order.store_name,
    });
  } else {
    // Fallback: legacy global lookup (single-user demo mode)
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

  console.log(`✅ Payment captured: ${order.order_id} | ₹${payment.amount / 100}`);
}

// ── payment.failed ────────────────────────────────────────────────────────────

async function handlePaymentFailed(
  payment: RazorpayPaymentEntity
): Promise<void> {
  const { rows: orderRows } = await db.query(
    "SELECT * FROM orders WHERE razorpay_order_id = $1",
    [payment.order_id]
  );

  if (!orderRows[0]) return;
  const order = orderRows[0];

  // Update order status
  await db.query(
    "UPDATE orders SET status = 'FAILED', updated_at = NOW() WHERE razorpay_order_id = $1",
    [payment.order_id]
  );

  // Find product and reset: PAYMENT_PENDING → AVAILABLE
  // Scope strictly to the product from order notes to prevent cross-order rollbacks
  const notesProductId = payment.notes?.product_id;
  const failProductQuery = notesProductId
    ? "SELECT id, shopify_variant_id FROM products WHERE id = $1 AND inventory_state = 'PAYMENT_PENDING'"
    : "SELECT id, shopify_variant_id FROM products WHERE store_id = $1 AND inventory_state = 'PAYMENT_PENDING'";
  const failProductParam = notesProductId ?? order.store_id;

  const { rows: productRows } = await db.query(failProductQuery, [failProductParam]);

  for (const product of productRows) {
    await setInventoryState(product.id, "AVAILABLE", {
      reservedDelta: -1,
      availableDelta: 1,
      reservationExpiresAt: null,
    });

    // Redis key auto-expires, but delete explicitly for speed
    await releaseLock(order.store_id, product.shopify_variant_id);
  }

  // Log failure
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

  // Route retry prompt to exact buyer via notes — never a global query
  const failPhoneNumber = payment.notes?.phone_number;
  if (failPhoneNumber) {
    await sendPaymentFailedWithRetry(failPhoneNumber, payment.amount / 100, 90);
  } else {
    // Fallback: legacy global lookup (single-user demo mode)
    const { rows: convRows } = await db.query(
      "SELECT phone_number FROM conversations ORDER BY updated_at DESC LIMIT 1"
    );
    if (convRows[0]) {
      await sendPaymentFailedWithRetry(convRows[0].phone_number, payment.amount / 100, 90);
    }
  }

  console.log(`❌ Payment failed: ${order.order_id} — lock released, inventory restored`);
}

export default router;
