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

import {
  loadConversation,
  updateConversationContext,
  appendMessage,
  type ConversationState,
} from "../services/conversation-memory.ts";

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

  // ── 1. Load multi-turn conversation context ────────────────────────────────
  const conv = await loadConversation(msg.conversationId, msg.from);

  // ── 2. Fetch catalog products for context & intent resolution ──────────────
  const { rows: storeRows } = await db.query(
    "SELECT id, name, city FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
  );
  const activeStore = storeRows[0];
  let availableProducts: any[] = [];
  if (activeStore) {
    const { rows: prods } = await db.query(
      "SELECT id, title, sku, listed_price, floor_price, inventory_available, image_url, shopify_variant_id FROM products WHERE store_id = $1 AND is_ai_enabled = true LIMIT 20",
      [activeStore.id]
    );
    availableProducts = prods;
  }

  const rawLower = msg.text.toLowerCase().trim();

  // ── 3. Detect photo / picture inquiry ──────────────────────────────────────
  const isPhotoQuery = /picture|photo|image|pic|look like|show me|photos/i.test(rawLower);
  if (isPhotoQuery) {
    let targetProduct = availableProducts.find((p) =>
      rawLower.includes(p.title.toLowerCase()) || (p.sku && rawLower.includes(p.sku.toLowerCase()))
    );
    if (!targetProduct && conv.activeProduct) {
      targetProduct = availableProducts.find((p) => p.title.toLowerCase() === conv.activeProduct?.title.toLowerCase());
    }
    if (!targetProduct && availableProducts.length > 0) {
      targetProduct = availableProducts[0];
    }

    if (targetProduct) {
      // Update active product
      await updateConversationContext(msg.conversationId, msg.from, {
        activeProduct: {
          id: targetProduct.id,
          title: targetProduct.title,
          listedPrice: parseFloat(targetProduct.listed_price),
          floorPrice: parseFloat(targetProduct.floor_price),
          imageUrl: targetProduct.image_url,
          sku: targetProduct.sku,
          variantId: targetProduct.shopify_variant_id,
        },
      });

      if (targetProduct.image_url && targetProduct.image_url.startsWith("http") && !targetProduct.image_url.startsWith("blob:")) {
        await sendImage(
          msg.from,
          targetProduct.image_url,
          `Here is ${targetProduct.title} (₹${parseFloat(targetProduct.listed_price).toLocaleString("en-IN")}) 📸`
        );
        await sendText(
          msg.from,
          `Would you like to buy *${targetProduct.title}*? You can say *"Buy for ₹${parseFloat(targetProduct.listed_price).toLocaleString("en-IN")}*" or make a counter offer!`
        );
        return;
      }
    }
  }

  // ── 4. Parse purchase intent & budget ──────────────────────────────────────
  let spendingLimit = extractSpendingLimit(msg.text);
  const isAffirmative = /^(yes|yeah|yep|sure|proceed|ok|okay|y|deal|buy it|send link|i want this|take it|let's do it)$/i.test(rawLower);
  const hasPurchaseWords = /buy|order|purchase|want|need|get me|book|checkout|pay|deal|discount|offer|price/i.test(rawLower);

  // Check if message mentions a specific product name
  const matchedProductInText = availableProducts.find((p) => rawLower.includes(p.title.toLowerCase()));

  // Resolve target product from message or previous conversation turns
  const activeTargetProduct = matchedProductInText || (conv.activeProduct ? availableProducts.find(p => p.title.toLowerCase() === conv.activeProduct?.title.toLowerCase()) : null);

  // If affirmative or purchase request without explicit numeric budget:
  if ((isAffirmative || hasPurchaseWords) && activeTargetProduct && !spendingLimit) {
    spendingLimit = parseFloat(activeTargetProduct.listed_price);
  }

  const isPurchaseIntent = spendingLimit !== null || (hasPurchaseWords && activeTargetProduct);

  if (!isPurchaseIntent) {
    // ── Handle open-ended messages with multi-turn LLM ─────────────────────
    await handleOpenEndedMessage(msg.from, msg.text, conv, availableProducts, activeStore);
    return;
  }

  // Fallback if user asked to buy generic items without any product or budget
  if (!spendingLimit) {
    await sendText(
      msg.from,
      "Hi! I'm ZapAI 🤖\n\nTell me what you'd like to buy and your budget.\n\nExample: *\"Buy running shoes under ₹4,000\"*"
    );
    return;
  }

  // Update active product in conversation memory
  if (activeTargetProduct) {
    await updateConversationContext(msg.conversationId, msg.from, {
      activeProduct: {
        id: activeTargetProduct.id,
        title: activeTargetProduct.title,
        listedPrice: parseFloat(activeTargetProduct.listed_price),
        floorPrice: parseFloat(activeTargetProduct.floor_price),
        imageUrl: activeTargetProduct.image_url,
        sku: activeTargetProduct.sku,
        variantId: activeTargetProduct.shopify_variant_id,
      },
      sessionState: "NEGOTIATING",
    });
  }

  await sendText(
    msg.from,
    `🔍 Got it! Searching for: "${activeTargetProduct ? activeTargetProduct.title : msg.text}"\nBudget: ₹${spendingLimit.toLocaleString("en-IN")}\n\nNegotiating best offer...`
  );

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
  const searchMessage = activeTargetProduct ? `Buy ${activeTargetProduct.title}` : msg.text;
  const decision = await buyerAgent.processTask({
    message: searchMessage,
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
    await sendText(msg.from, `Sorry, couldn't find matching products within ₹${spendingLimit}. ${decision.reasoning || ""}`);
    return;
  }

  const { offer, mandate } = decision;

  // ── Send product image if available (guaranteed before text) ─────────────
  if (offer.product.imageUrl && offer.product.imageUrl.startsWith("http") && !offer.product.imageUrl.startsWith("blob:")) {
    try {
      await sendImage(msg.from, offer.product.imageUrl, offer.product.title);
    } catch (imgErr) {
      console.warn("[Worker] Image send failed (proceeding with text):", imgErr);
    }
  }

  await sendText(
    msg.from,
    `✅ Found a deal!\n\n*${offer.product.title}*\n` +
    `Listed: ₹${offer.product.listedPrice.toLocaleString("en-IN")}\n` +
    `*Offer: ₹${offer.offeredPrice.toLocaleString("en-IN")}*${offer.shippingFree ? " + Free Shipping 🚚" : ""}\n\n` +
    `_${offer.reasoningTrace}_\n\nLocking inventory and creating payment link...`
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
      mandate_id, amount, currency, status,
      customer_phone, customer_name, product_title, sku
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      storeId,
      rzpOrder.id,
      orderId,
      x402TxId,
      mandate.mandateId,
      offer.offeredPrice,
      "INR",
      "CREATED",
      msg.from,
      conv.customerName || "Customer",
      offer.product.title,
      offer.product.sku || "",
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

// ── Handle general/open-ended messages with multi-turn LLM ───────────────────
async function handleOpenEndedMessage(
  to: string,
  userMessage: string,
  conv: ConversationState,
  availableProducts: any[],
  store: any
): Promise<void> {
  try {
    let productContext = "";
    if (availableProducts.length > 0) {
      productContext = `\n\nCURRENT INVENTORY CATALOG:\n` + availableProducts
        .map((p: any) => `- ${p.title} (SKU: ${p.sku}): Listed ₹${p.listed_price} (Floor limit ₹${p.floor_price || p.listed_price}, ${p.inventory_available} in stock)`)
        .join("\n");
    }

    const activeProdNote = conv.activeProduct
      ? `\nCURRENT PRODUCT BEING DISCUSSED: "${conv.activeProduct.title}" (Listed: ₹${conv.activeProduct.listedPrice})`
      : "";

    const systemPrompt = `You are a friendly, witty WhatsApp seller agent for ${store?.name ?? "our store"} in ${store?.city ?? "India"}.
${productContext}${activeProdNote}

GUIDELINES:
- Be conversational, human, and concise (1-3 sentences max).
- Remember the ongoing conversation context. If the user previously asked about an item and now says "yes", "sure", or "tell me more", continue on that same item.
- If the customer wants to buy, tell them the price (e.g. ₹${conv.activeProduct?.listedPrice || availableProducts[0]?.listed_price || 1200}) and ask if they would like you to lock it in and send the payment link.
- Never make up products or prices not in the catalog above.
- Use 1 emoji maximum.
- ONLY use Indian Rupee currency symbol ₹ (INR). NEVER use dollar ($) signs or USD.`;

    // Build multi-turn messages array from previous turns
    const historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    const recentTranscript = conv.transcript.slice(-6); // last 6 turns
    for (const m of recentTranscript) {
      historyMessages.push({
        role: m.sender === "customer" ? "user" : "assistant",
        content: m.content,
      });
    }

    // Ensure last message in history isn't identical duplicate of userMessage
    const lastHist = historyMessages[historyMessages.length - 1];
    if (!lastHist || lastHist.content !== userMessage) {
      historyMessages.push({ role: "user", content: userMessage });
    }

    // 1. Try Groq with active models
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
              ...historyMessages,
            ],
            temperature: 0.7,
            max_tokens: 180,
          });

          const reply = chat.choices[0]?.message?.content?.trim();
          if (reply) {
            // Track if product was mentioned
            const mentioned = availableProducts.find(p => reply.toLowerCase().includes(p.title.toLowerCase()) || userMessage.toLowerCase().includes(p.title.toLowerCase()));
            if (mentioned) {
              await updateConversationContext(conv.conversationId, to, {
                activeProduct: {
                  id: mentioned.id,
                  title: mentioned.title,
                  listedPrice: parseFloat(mentioned.listed_price),
                  floorPrice: parseFloat(mentioned.floor_price),
                  imageUrl: mentioned.image_url,
                  sku: mentioned.sku,
                  variantId: mentioned.shopify_variant_id,
                },
              });
            }

            const cleanReply = reply.replace(/\$([0-9,]+(\.[0-9]+)?)/g, "₹$1").replace(/\$/g, "₹");
            await sendText(to, cleanReply);
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
        const convoSummary = historyMessages.map(h => `${h.role === "user" ? "Customer" : "Agent"}: ${h.content}`).join("\n");
        const result = await model.generateContent(`${systemPrompt}\n\nChat History:\n${convoSummary}\nAgent:`);
        const reply = result.response.text()?.trim();
        if (reply) {
          const cleanReply = reply.replace(/\$([0-9,]+(\.[0-9]+)?)/g, "₹$1").replace(/\$/g, "₹");
          await sendText(to, cleanReply);
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
