import { dequeueJob } from "../services/redis.ts";
import { BuyerAgent } from "../agents/buyer-agent.ts";
import { SellerAgent } from "../agents/seller-agent.ts";
import { acquireLock, releaseLock } from "../services/redis.ts";
import { createOrder, createStandardPaymentLink, generateOrderId, rupeesToPaise } from "../services/razorpay.ts";
import { issueTransactionId } from "../services/x402.ts";
import { setInventoryState, getProductById, getStore, getProducts, getNegotiationRules } from "../services/merchant.ts";
import { logEvent } from "../services/audit.ts";
import { checkBuyerVelocity } from "../services/rate-limit.ts";
import {
  sendText,
  sendImage,
  sendPaymentLink,
  sendPaymentFailedWithRetry,
} from "../services/whatsapp.ts";
import { db } from "../db/migrate.ts";
import { getGroqClient, getGeminiClient } from "../services/ai.ts";
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

export async function handleJob(job: WorkerJob): Promise<void> {
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
  const isPurchaseIntent = spendingLimit !== null ||
    /buy|order|purchase|want|need|get me|book|checkout|pay|price|cost|how much|deal|offer|discount/i.test(msg.text);

  if (!isPurchaseIntent) {
    // ── Handle open-ended messages with Groq AI ───────────────────────────
    await handleOpenEndedMessage(msg.from, msg.text);
    return;
  }

  if (!spendingLimit) {
    await sendText(
      msg.from,
      "Hi! I'm ZapAI 🤖\n\nTell me what you'd like to buy and your budget.\n\nExample: *\"Buy running shoes under ₹4,000\"*"
    );
    return;
  }

  await sendText(msg.from, `🔍 Got it! Searching for: "${msg.text}"\nBudget: ₹${spendingLimit.toLocaleString("en-IN")}\n\nQuerying stores...`);

  // ── Velocity / fraud check ─────────────────────────────────────────────────
  const velocity = await checkBuyerVelocity(msg.from);
  if (!velocity.allowed) {
    const resetMin = Math.ceil((velocity.resetInSeconds ?? 300) / 60);
    await sendText(
      msg.from,
      `⚠️ Transaction limit reached (max 3 per 5 minutes).\nPlease try again in ~${resetMin} minute${resetMin !== 1 ? "s" : ""}.`
    );
    return;
  }

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

  // ── Send product image if available (fires before the text) ──────────────
  if (offer.product.imageUrl) {
    try {
      await sendImage(msg.from, offer.product.imageUrl, offer.product.title);
    } catch (imgErr) {
      // Non-fatal — image delivery failure never blocks the deal
      console.warn("[Worker] Image send failed (proceeding with text):", imgErr);
    }
  }

  await sendText(
    msg.from,
    `✅ Found a deal!\n\n*${offer.product.title}*\n` +
    `Listed: ₹${offer.product.listedPrice.toLocaleString("en-IN")}\n` +
    `*Offer: ₹${offer.offeredPrice.toLocaleString("en-IN")}*${offer.shippingFree ? " + Free Shipping 🚚" : ""}\n\n` +
    `_${offer.reasoningTrace}_\n\nLocking inventory and creating payment...`
  );

  // ── Autonomous upsell / cross-sell suggestion ───────────────────────────
  // Fire-and-forget: send bundle suggestion if below free-shipping threshold.
  // Non-blocking — does not delay the payment link creation.
  (async () => {
    try {
      const { rows: storeRows } = await db.query(
        "SELECT id FROM products WHERE shopify_variant_id = $1 LIMIT 1",
        [offer.product.variantId]
      );
      if (storeRows[0]) {
        const storeIdForUpsell = (await db.query(
          "SELECT store_id FROM products WHERE shopify_variant_id = $1 LIMIT 1",
          [offer.product.variantId]
        )).rows[0]?.store_id;

        if (storeIdForUpsell) {
          const [allProducts, rules] = await Promise.all([
            getProducts(storeIdForUpsell),
            getNegotiationRules(storeIdForUpsell),
          ]);
          if (rules) {
            const seller = new SellerAgent(storeIdForUpsell);
            const upsell = await seller.generateUpsell(
              offer.product,
              offer.offeredPrice,
              rules,
              allProducts.map((p) => p.agentSchema)
            );
            if (upsell) {
              await sendText(msg.from, upsell.upsellMessage);
            }
          }
        }
      }
    } catch {
      // Upsell is best-effort — never block the payment flow
    }
  })();

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
      // Pass routing metadata so the webhook handler can target the exact buyer
      notes: {
        conversation_id: msg.conversationId,
        phone_number: msg.from,
        product_id: productId,
      },
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
    description: `ZapAI: ${offer.product.title} | ${orderId}`,
    callbackUrl: `${process.env.APP_URL}/payment-complete`,
    referenceId: orderId,
  }) as unknown as { short_url: string; id: string };

  await sendPaymentLink(
    msg.from,
    offer.offeredPrice,
    paymentLink.short_url,
    store?.name ?? "ZapAI Store"
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
    description: `ZapAI Retry: ${order.order_id}`,
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

// ── Handle general/open-ended messages with Groq AI ───────────────────────────
async function handleOpenEndedMessage(to: string, userMessage: string): Promise<void> {
  try {
    // Fetch a store to get context (use first active store)
    const { rows: storeRows } = await db.query(
      "SELECT id, name, city FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
    );
    const store = storeRows[0];

    // Fetch products for context & image check
    let productContext = "";
    let matchingImageProduct: any = null;
    if (store) {
      const { rows: products } = await db.query(
        "SELECT title, sku, listed_price, inventory_available, image_url FROM products WHERE store_id = $1 AND is_ai_enabled = true LIMIT 10",
        [store.id]
      );
      if (products.length > 0) {
        productContext = `\n\nCATALOG (top items):\n` + products
          .map((p: any) => `- ${p.title}: ₹${p.listed_price} (${p.inventory_available} in stock)`)
          .join("\n");

        // Check if user specifically asked for a photo/picture
        const isPhotoQuery = /picture|photo|image|pic|look like|show me/i.test(userMessage);
        if (isPhotoQuery) {
          const uLower = userMessage.toLowerCase();
          matchingImageProduct = products.find((p: any) =>
            uLower.includes(p.title.toLowerCase()) ||
            (p.sku && uLower.includes(p.sku.toLowerCase()))
          ) || products[0];
        }
      }
    }

    // If user asked for an image and product has a valid public HTTP image URL
    if (matchingImageProduct && matchingImageProduct.image_url && matchingImageProduct.image_url.startsWith("http") && !matchingImageProduct.image_url.startsWith("blob:")) {
      try {
        await sendImage(to, matchingImageProduct.image_url, `Here is ${matchingImageProduct.title} (₹${matchingImageProduct.listed_price}) 📸`);
        await sendText(to, `What do you think? Tell me your budget if you'd like to place an order!`);
        return;
      } catch (imgErr) {
        console.warn("⚠️ Failed to send image via WhatsApp:", imgErr);
      }
    }

    const systemPrompt = `You are a friendly WhatsApp seller agent for ${store?.name ?? "our store"} in ${store?.city ?? "India"}. Answer customer questions naturally and helpfully.${productContext}

GUIDELINES:
- Be warm, brief (1-3 sentences max)
- Use 1 emoji maximum
- Mention relevant products from the catalog if applicable
- If someone asks about buying, encourage them to specify a budget so you can find the best deal
- Never make up stock or prices not listed above
- Use Indian English, ₹ for prices`;

    // 1. Try Groq with available models on this account
    const groq = getGroqClient();
    if (groq) {
      const modelsToTry = [
        "qwen/qwen3.8-27b",
        "groq/compound-mini",
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ];
      for (const model of modelsToTry) {
        try {
          const chat = await groq.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 150,
          });

          const reply = chat.choices[0]?.message?.content?.trim();
          if (reply) {
            await sendText(to, reply);
            return;
          }
        } catch {
          // Continue to next model
        }
      }
    }

    // 2. Try Gemini 3.6 Flash fallback
    const genAI = getGeminiClient();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`);
        const reply = result.response.text()?.trim();
        if (reply) {
          await sendText(to, reply);
          return;
        }
      } catch (geminiErr: any) {
        console.warn("⚠️ Gemini fallback error:", geminiErr?.message || geminiErr);
      }
    }

    await sendText(to, "Hi! 👋 How can I help you today? Tell me what you're looking for and I'll find the best deal for you!");
  } catch (err) {
    console.error("[Worker] Open-ended message error:", err);
    await sendText(to, "Hi! 👋 What are you looking for today? I can help you find the best products and deals!");
  }
}
