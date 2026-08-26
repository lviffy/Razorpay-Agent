import { getGroqClient, getGeminiClient } from "../services/ai.ts";
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
  const { state, store } = context;

  // Direct fast paths for deterministic outcomes
  if (commerceResult.type === "PAYMENT_RETRY_READY" && commerceResult.paymentUrl) {
    return {
      text: `Here's your updated checkout link for ₹${commerceResult.paymentAmount?.toLocaleString("en-IN")}:\n${commerceResult.paymentUrl}`,
      isPaymentLink: true,
      paymentAmount: commerceResult.paymentAmount,
      paymentUrl: commerceResult.paymentUrl,
    };
  }

  if (commerceResult.type === "PAYMENT_LINK_CREATED" && commerceResult.paymentUrl) {
    const title = commerceResult.product?.title || "your item";
    const amount = commerceResult.paymentAmount || commerceResult.product?.offeredPrice || 0;
    return {
      text: `Deal locked for *${title}* at ₹${amount.toLocaleString("en-IN")} with free express shipping! 🚚\n\nPay here to complete your order:\n${commerceResult.paymentUrl}`,
      isPaymentLink: true,
      paymentAmount: amount,
      paymentUrl: commerceResult.paymentUrl,
      mediaUrl: commerceResult.mediaUrlToSend,
    };
  }

  if (commerceResult.type === "ORDER_CANCELLED") {
    return {
      text: "No problem, I've cancelled that search. Let me know whenever you'd like to explore other items!",
    };
  }

  if (commerceResult.type === "CLARIFICATION_NEEDED") {
    return {
      text: "Sure! What type of product are you looking for, or do you have a specific budget in mind?",
    };
  }

  // Multi-turn natural dialogue generation via LLM
  const prompt = buildResponsePrompt(userMessage, intent, commerceResult, context);

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
              content: `You are ZapAI, a helpful, conversational shopping assistant on WhatsApp for ${store.name} in ${store.city}.
GUIDELINES:
- Reply in 1 to 3 short sentences.
- Speak naturally and confidently in Indian English.
- Use strictly Indian Rupee symbol (₹). Never use dollars ($) or USD.
- Use 1 emoji maximum.
- NEVER narrate backend execution (do not say "searching database", "locking inventory", "calculating margin", "mandate verified", "calling tool").
- State the final customer-facing result directly and warmly.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 1500,
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

  const productInfo = commerce.product
    ? `Product: ${commerce.product.title}, Listed: ₹${commerce.product.listedPrice}, Offered Deal: ₹${commerce.product.offeredPrice}`
    : state.activeProduct
    ? `Product: ${state.activeProduct.title}, Listed: ₹${state.activeProduct.listedPrice}`
    : "None";

  return `CUSTOMER MESSAGE: "${userMessage}"
DETECTED INTENT: ${intent.intent}
OUTCOME TYPE: ${commerce.type}
CURRENT PRODUCT ON TABLE: ${productInfo}
STORE: ${store.name} (${store.city})
ADDITIONAL CONTEXT: ${commerce.infoDetails || commerce.errorMessage || (commerce.offer ? commerce.offer.reasoningTrace : "")}

TASK:
Write the natural WhatsApp response to the customer reflecting this outcome. 
If a price deal is proposed, mention the exact price in ₹ and ask if they would like you to lock it in.
Keep it strictly 1-3 sentences.`;
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
    return `I found the *${commerce.product.title}* for ₹${commerce.product.offeredPrice.toLocaleString("en-IN")}! Want me to lock in this deal for you?`;
  }
  if (commerce.errorMessage) {
    return commerce.errorMessage;
  }
  return "How can I help you today? Tell me what you're looking for and I'll find the best deal for you!";
}
