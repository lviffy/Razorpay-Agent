import { getGroqClient } from "../services/ai.ts";
import type { ConversationContext, ConversationIntent, CommerceResult, GeneratedCustomerResponse } from "./types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Natural Customer Response Generator — Unified Conversational Persona
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCustomerResponse(
  userMessage: string,
  intent: ConversationIntent,
  commerceResult: CommerceResult,
  context: ConversationContext
): Promise<GeneratedCustomerResponse> {
  const { store } = context;

  // ── 1. Fast Direct Paths for Deterministic Outcomes ───────────────────────

  // Greeting
  if (commerceResult.type === "GREETING") {
    return {
      text: `Hey there! 👋 Welcome to ${store.name}. What can I help you find today?`,
    };
  }

  // Catalog Listing
  if (commerceResult.type === "CATALOG_LIST" && commerceResult.catalogItems?.length) {
    const listText = commerceResult.catalogItems
      .map((item) => `• *${item.title}* — ₹${item.price.toLocaleString("en-IN")}`)
      .join("\n");

    return {
      text: `Here are our featured items at ${store.name}:\n\n${listText}\n\nLet me know which one you'd like to check out!`,
      mediaList: commerceResult.mediaList,
      mediaUrl: commerceResult.mediaUrlToSend,
      mediaCaption: commerceResult.mediaCaption,
    };
  }

  // Photo Delivery
  if (commerceResult.type === "PHOTO_FOUND") {
    const title = commerceResult.product?.title || "item";
    const price = commerceResult.product?.offeredPrice || commerceResult.product?.listedPrice || 0;
    return {
      text: `Here is the picture of *${title}* (₹${price.toLocaleString("en-IN")}) 📸 Let me know if you'd like to grab it or see other options!`,
      mediaUrl: commerceResult.mediaUrlToSend,
      mediaCaption: `Here is ${title} (₹${price.toLocaleString("en-IN")}) 📸`,
    };
  }

  // Payment Link Created
  if (commerceResult.type === "PAYMENT_LINK_CREATED" && commerceResult.paymentUrl) {
    const qty = commerceResult.quantity || 1;
    const title = commerceResult.product?.title || "your item";
    const itemLabel = qty > 1 ? `${qty}x *${title}*` : `*${title}*`;
    const amount = commerceResult.paymentAmount || (commerceResult.product?.offeredPrice ? commerceResult.product.offeredPrice * qty : 0);
    return {
      text: `Deal locked for ${itemLabel} at ₹${amount.toLocaleString("en-IN")}! 🚚\n\nTap below to complete payment via Razorpay:\n${commerceResult.paymentUrl}`,
      isPaymentLink: true,
      paymentAmount: amount,
      paymentUrl: commerceResult.paymentUrl,
      quantity: qty,
      mediaUrl: commerceResult.mediaUrlToSend,
    };
  }

  // Payment Retry
  if (commerceResult.type === "PAYMENT_RETRY_READY" && commerceResult.paymentUrl) {
    return {
      text: `Here's your updated checkout link for ₹${commerceResult.paymentAmount?.toLocaleString("en-IN")}:\n${commerceResult.paymentUrl}`,
      isPaymentLink: true,
      paymentAmount: commerceResult.paymentAmount,
      paymentUrl: commerceResult.paymentUrl,
    };
  }

  // Order Cancelled
  if (commerceResult.type === "ORDER_CANCELLED") {
    return {
      text: "No problem, I've cancelled that search. Let me know whenever you'd like to explore other items!",
    };
  }

  // Clarification
  if (commerceResult.type === "CLARIFICATION_NEEDED") {
    return {
      text: "Sure! What type of product are you looking for, or do you have a specific budget in mind?",
    };
  }

  // ── 2. Natural Multi-Turn Negotiation / Inquiry Response via LLM ──────────
  const prompt = buildResponsePrompt(userMessage, intent, commerceResult, context);
  const catalogList = context.availableProducts.slice(0, 10).map((p) => `- ${p.title} (Listed ₹${p.listedPrice})`).join("\n");

  const groq = getGroqClient();
  if (groq) {
    const models = ["qwen/qwen3.6-27b", "openai/gpt-oss-120b"];
    for (const m of models) {
      try {
        const chat = await groq.chat.completions.create({
          model: m,
          messages: [
            {
              role: "system",
              content: `You are ZapAI, a helpful, natural shopping assistant on WhatsApp for ${store.name} in ${store.city}.

CURRENT STORE CATALOG:
${catalogList || "(No items listed)"}

CRITICAL RULES:
- ONLY talk about items and categories actually in the catalog above.
- NEVER hallucinate or invent groceries, dairy, vegetables, milk, or fake items.
- Reply in 1 to 2 short sentences.
- Speak naturally and warmly in Indian English.
- Use strictly Indian Rupee symbol (₹). Never use dollars ($) or USD.
- Use 1 emoji maximum.
- NEVER narrate backend execution (do not say "searching database", "locking inventory", "calculating margin").
- Avoid repetitive template endings. Speak like a real human shop assistant.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 512,
        });

        let reply = chat.choices[0]?.message?.content?.trim() || "";
        reply = cleanAndSanitizeResponse(reply);
        if (reply) {
          return {
            text: reply,
            mediaUrl: commerceResult.mediaUrlToSend,
            mediaCaption: commerceResult.mediaCaption,
          };
        }
      } catch {
        // try next model
      }
    }
  }

  // Deterministic fallback response
  return {
    text: fallbackResponseText(commerceResult),
    mediaUrl: commerceResult.mediaUrlToSend,
    mediaCaption: commerceResult.mediaCaption,
  };
}

function buildResponsePrompt(
  userMessage: string,
  intent: ConversationIntent,
  commerce: CommerceResult,
  context: ConversationContext
): string {
  const { state, store } = context;

  const exactStock = commerce.product?.inventoryAvailable ?? state.activeProduct?.inventoryAvailable ?? 1;

  const productInfo = commerce.product
    ? `Product: ${commerce.product.title}, Listed: ₹${commerce.product.listedPrice}, Offered Price: ₹${commerce.product.offeredPrice}, Exact Stock in Inventory: ${exactStock} unit(s)`
    : state.activeProduct
    ? `Product: ${state.activeProduct.title}, Listed: ₹${state.activeProduct.listedPrice}, Current Offered: ₹${state.currentOffer?.offeredPrice || state.activeProduct.listedPrice}, Exact Stock in Inventory: ${exactStock} unit(s)`
    : "None";

  return `CUSTOMER MESSAGE: "${userMessage}"
DETECTED INTENT: ${intent.intent}
OUTCOME TYPE: ${commerce.type}
CURRENT PRODUCT & LIVE STOCK: ${productInfo}
STORE: ${store.name} (${store.city})
CONTEXT & STOCK DETAILS: ${commerce.infoDetails || commerce.errorMessage || (commerce.offer ? commerce.offer.reasoningTrace : "")}

TASK:
Write a warm, concise WhatsApp response (1-2 sentences).
If the customer asks how many are available or about stock quantity, state the exact live stock (${exactStock} unit${exactStock === 1 ? "" : "s"}). Never say "plenty" or guess stock.
If a price or purchase is discussed, invite them to confirm so you can set up their checkout.`;
}

function cleanAndSanitizeResponse(text: string): string {
  // 1. Strip <think> tags (including truncated thinking blocks)
  let clean = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

  // 2. Normalize currency symbols
  clean = clean.replace(/\$([0-9,]+(\.[0-9]+)?)/g, "₹$1").replace(/\$/g, "₹");

  // 3. Remove internal IDs or technical leaks
  clean = clean.replace(/\b(mnd_[a-zA-Z0-9_-]+|var_[a-zA-Z0-9_-]+|pay_[a-zA-Z0-9_-]+|order_[a-zA-Z0-9_-]+)\b/g, "");

  // 4. Remove robotic implementation narration phrases
  clean = clean.replace(/searching stores and negotiating best offer\.\.\.?/gi, "");
  clean = clean.replace(/locking inventory and creating payment link\.\.\.?/gi, "");

  return clean.trim();
}

function fallbackResponseText(commerce: CommerceResult): string {
  if (commerce.product) {
    return `We can offer *${commerce.product.title}* for ₹${commerce.product.offeredPrice.toLocaleString("en-IN")}! Let me know if you'd like to take it.`;
  }
  if (commerce.errorMessage) {
    return commerce.errorMessage;
  }
  return "How can I help you today? Tell me what you're looking for and I'll find the best deal for you!";
}
