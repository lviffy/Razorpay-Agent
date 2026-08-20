import { dequeueJob } from "../services/redis.ts";
import { BuyerAgent } from "../agents/buyer-agent.ts";
import { acquireLock, releaseLock } from "../services/redis.ts";
import { createOrder, createStandardPaymentLink, generateOrderId, rupeesToPaise } from "../services/razorpay.ts";
import { issueTransactionId } from "../services/x402.ts";
import { setInventoryState, getProductById, getStore } from "../services/merchant.ts";
import { logEvent } from "../services/audit.ts";
import {
  sendText,
  sendPaymentLink,
  sendPaymentFailedWithRetry,
} from "../services/whatsapp.ts";
import { db } from "../db/migrate.ts";
import type { WorkerJob } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Worker — processes jobs from Redis queue asynchronously
// Runs in same process as Express (no separate service needed for demo)
// ─────────────────────────────────────────────────────────────────────────────

let running = false;

export function startWhatsAppWorker(): void {
  if (running) return;
  running = true;
  processLoop();
}

async function processLoop(): Promise<void> {
  console.log("[Worker] WhatsApp worker started — polling Redis queue...");
  while (running) {
    try {
      const job = (await dequeueJob(5)) as WorkerJob | null;
      if (!job) continue;

      console.log(`[Worker] Processing job: ${job.type}`);
      await handleJob(job);
    } catch (err) {
      console.error("[Worker] Error processing job:", err);
      // Brief pause before retrying on error
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function handleJob(job: WorkerJob): Promise<void> {
  const { payload: msg } = job;

  // ── Button reply: Retry payment ────────────────────────────────────────────
  if (msg.buttonReply?.id === "retry_payment") {
    await handleRetryPayment(msg.conversationId, msg.from);
    return;
  }

  if (msg.buttonReply?.id === "cancel_order") {
    await sendText(msg.from, "Order cancelled. Let me know if you'd like to search again!");
    return;
  }

  // ── Parse spending limit from message ──────────────────────────────────────
  const spendingLimit = extractSpendingLimit(msg.text);

  if (!spendingLimit) {
    await sendText(
      msg.from,
      "Hi! I'm AgentBridge 🤖\n\nTell me what you'd like to buy and your budget.\n\nExample: *\"Buy running shoes under ₹4,000\"*"
    );
    return;
  }

  await sendText(msg.from, `🔍 Got it! Searching for: "${msg.text}"\nBudget: ₹${spendingLimit.toLocaleString("en-IN")}\n\nQuerying stores...`);

  // ── Run Buyer Agent ────────────────────────────────────────────────────────
  const buyerAgent = new BuyerAgent();
  const decision = await buyerAgent.processTask({
    message: msg.text,
    spendingLimit,
    phoneNumber: msg.from,
    conversationId: msg.conversationId,
    waMessageId: msg.messageId,
  });

  // ── Escalate to user ───────────────────────────────────────────────────────
  if (decision.escalateToUser && decision.escalationMessage) {
    await sendText(msg.from, decision.escalationMessage);
    return;
  }

  // ── No offers found ────────────────────────────────────────────────────────
  if (!decision.accepted || !decision.offer || !decision.mandate) {
    await sendText(msg.from, `Sorry, couldn't find matching products. ${decision.reasoning}`);
    return;
  }

  const { offer, mandate } = decision;

  await sendText(
    msg.from,
    `✅ Found a deal!\n\n*${offer.product.title}*\n` +
    `Listed: ₹${offer.product.listedPrice.toLocaleString("en-IN")}\n` +
    `*Offer: ₹${offer.offeredPrice.toLocaleString("en-IN")}*${offer.shippingFree ? " + Free Shipping 🚚" : ""}\n\n` +
    `_${offer.reasoningTrace}_\n\nLocking inventory and creating payment...`
  );

  // ── Find product ID ────────────────────────────────────────────────────────
  const { rows: productRows } = await db.query(
    "SELECT id, store_id FROM products WHERE shopify_variant_id = $1",
    [offer.product.variantId]
  );
  if (!productRows[0]) {
    await sendText(msg.from, "Product not found. Please try again.");
    return;
  }

  const productId = productRows[0].id as string;
  const storeId = productRows[0].store_id as string;

  // ── Mandate check (server-side enforcement) ────────────────────────────────
  if (!buyerAgent.canAuthorizePayment(offer.offeredPrice, mandate)) {
    await sendText(msg.from, `❌ Cannot authorize: offer ₹${offer.offeredPrice} exceeds mandate limit ₹${mandate.spendingLimit}.`);
    return;
  }

  // ── Acquire Redis inventory lock ───────────────────────────────────────────
  const lockAcquired = await acquireLock(storeId, offer.product.variantId);
  if (!lockAcquired) {
    await sendText(msg.from, `⚠️ That item was just reserved by another buyer. Let me check alternatives...`);
    return;
  }

  // ── Update inventory: AVAILABLE → RESERVED ────────────────────────────────
  await setInventoryState(productId, "RESERVED", {
    reservedDelta: 1,
    availableDelta: -1,
    reservationExpiresAt: new Date(Date.now() + 120_000),
  });

  // ── Generate x402 transaction ID ──────────────────────────────────────────
  const x402TxId = issueTransactionId();
  const orderId = generateOrderId();

  // ── Create Razorpay Order ─────────────────────────────────────────────────
  let rzpOrder: { id: string };
  try {
    rzpOrder = (await createOrder({
      amountInPaise: rupeesToPaise(offer.offeredPrice),
      receipt: x402TxId,
      sessionId: offer.sessionId,
    })) as unknown as { id: string };
  } catch (err) {
    await releaseLock(storeId, offer.product.variantId);
    await setInventoryState(productId, "AVAILABLE", {
      reservedDelta: -1,
      availableDelta: 1,
      reservationExpiresAt: null,
    });
    await sendText(msg.from, "Failed to create payment order. Please try again.");
    return;
  }

  // ── Update inventory: RESERVED → PAYMENT_PENDING ──────────────────────────
  await setInventoryState(productId, "PAYMENT_PENDING");

  // ── Save order to DB ──────────────────────────────────────────────────────
  await db.query(
    `INSERT INTO orders (
      store_id, razorpay_order_id, order_id, x402_tx_hash,
      mandate_id, amount, currency, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      storeId,
      rzpOrder.id,
      orderId,
      x402TxId,
      mandate.mandateId,
      offer.offeredPrice,
      "INR",
      "CREATED",
    ]
  );

  // ── Log: INVENTORY_LOCKED ─────────────────────────────────────────────────
  await logEvent("INVENTORY_LOCKED", {
    whatsappMessageId: msg.messageId,
    conversationId: msg.conversationId,
    x402TransactionId: x402TxId,
  }, {
    productId,
    storeId,
    variantId: offer.product.variantId,
    price: offer.offeredPrice,
    mandateId: mandate.mandateId,
  });

  // ── Create Standard Payment Link and send via WhatsApp ───────────────────
  const store = await getStore(storeId);
  const paymentLink = await createStandardPaymentLink({
    amountInPaise: rupeesToPaise(offer.offeredPrice),
    description: `AgentBridge: ${offer.product.title} | ${orderId}`,
    callbackUrl: `${process.env.APP_URL}/payment-complete`,
    referenceId: orderId,
  }) as unknown as { short_url: string; id: string };

  await sendPaymentLink(
    msg.from,
    offer.offeredPrice,
    paymentLink.short_url,
    store?.name ?? "AgentBridge Store"
  );

  console.log(`[Worker] Payment link sent for ${orderId}: ${paymentLink.short_url}`);
}

async function handleRetryPayment(conversationId: string, from: string): Promise<void> {
  // Find the pending order for this conversation
  const { rows } = await db.query(
    `SELECT o.*, ord.store_id
     FROM orders o
     WHERE o.status = 'CREATED'
     ORDER BY o.created_at DESC LIMIT 1`
  );

  if (!rows[0]) {
    await sendText(from, "No pending order found. Please start a new search.");
    return;
  }

  const order = rows[0];
  const paymentLink = (await createStandardPaymentLink({
    amountInPaise: rupeesToPaise(parseFloat(order.amount)),
    description: `AgentBridge Retry: ${order.order_id}`,
    callbackUrl: `${process.env.APP_URL}/payment-complete`,
    referenceId: order.order_id,
  })) as unknown as { short_url: string; id: string };

  await sendText(from, `🔄 New payment link generated:\n${paymentLink.short_url}`);
}

function extractSpendingLimit(message: string): number | null {
  // Patterns: "under ₹4,000", "below 4000", "₹4000", "within 4,000"
  const patterns = [
    /(?:under|below|within|max|upto|up to|budget|less than)\s*[₹rs.]?\s*([\d,]+)/i,
    /[₹rs.]\s*([\d,]+)/i,
    /([\d,]+)\s*(?:rupees|rs|inr)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}
