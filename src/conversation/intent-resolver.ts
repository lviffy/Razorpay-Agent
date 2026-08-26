import { getGroqClient, getGeminiClient } from "../services/ai.ts";
import type { ConversationContext, ConversationIntent, ConversationIntentType } from "./types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Intent & Reference Resolver — Context-First Language Understanding
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveIntent(
  userMessage: string,
  context: ConversationContext
): Promise<ConversationIntent> {
  const rawLower = userMessage.toLowerCase().trim();
  const { state, availableProducts, store } = context;

  // ── 1. Protocol-level button replies ──────────────────────────────────────
  if (rawLower.includes("[button:retry_payment]") || rawLower === "retry_payment") {
    return {
      intent: "PAYMENT_RETRY",
      confidence: 1.0,
      referencedProductTitle: state.activeProduct?.title,
    };
  }

  if (rawLower.includes("[button:cancel_order]") || rawLower === "cancel_order") {
    return {
      intent: "CANCELLATION",
      confidence: 1.0,
      referencedProductTitle: state.activeProduct?.title,
    };
  }

  // ── 2. Check for photo request ─────────────────────────────────────────────
  const isPhotoRequest = /picture|photo|image|pic|look like|show me|photos/i.test(rawLower);

  // ── 3. Build compact grounded catalog context ─────────────────────────────
  const catalogSummary = availableProducts.slice(0, 15).map((p) => ({
    id: p.id,
    variantId: p.shopifyVariantId,
    title: p.title,
    sku: p.sku,
    listedPrice: p.listedPrice,
    floorPrice: p.floorPrice,
    inStock: p.inventoryAvailable > 0,
    category: p.agentSchema?.attributes?.category || "General",
  }));

  // ── 4. Build prompt with active conversation context ──────────────────────
  const activeProductDesc = state.activeProduct
    ? `Title: "${state.activeProduct.title}" (Listed: ₹${state.activeProduct.listedPrice}${state.activeProduct.offeredPrice ? `, Offered: ₹${state.activeProduct.offeredPrice}` : ""})`
    : "None currently active";

  const currentOfferDesc = state.currentOffer
    ? `Product: "${state.currentOffer.productTitle}", Offered Price: ₹${state.currentOffer.offeredPrice}, Status: ${state.currentOffer.status}`
    : "None";

  const recentTranscriptText = state.transcript
    .slice(-6)
    .map((t: any) => `${t.sender === "customer" ? "Customer" : "Assistant"}: ${t.content}`)
    .join("\n");

  const prompt = `You are the Intent & Context Resolution Engine for ZapAI on WhatsApp (${store.name} in ${store.city}).

ACTIVE CONVERSATION STATE:
- Active Product: ${activeProductDesc}
- Current Offer on Table: ${currentOfferDesc}
- Buyer Budget Known: ${state.buyerBudget ? `₹${state.buyerBudget}` : "Unknown"}
- Awaiting Confirmation: ${state.awaitingConfirmation || "None"}
- Session State: ${state.sessionState}

RECENT MESSAGE HISTORY:
${recentTranscriptText || "(No prior messages)"}

CURRENT USER MESSAGE: "${userMessage}"

AVAILABLE STORE CATALOG:
${JSON.stringify(catalogSummary, null, 1)}

TASK:
Analyze the user message IN LIGHT OF THE ACTIVE CONVERSATION CONTEXT.
Determine the accurate intent and resolve any pronouns ("this", "that", "same one", "cheaper", "yes", "okay", "send link").

RULES:
1. Short affirmative replies ("yes", "ok", "sure", "deal", "send link", "buy it", "go ahead") when an active offer or product is discussed mean ACCEPT_OFFER or PAYMENT_REQUEST for the ACTIVE product.
2. Price counter-offers ("can you do 3500?", "cheaper", "little less", "best price?") when an active product exists mean PRICE_NEGOTIATION on the ACTIVE product.
3. Pronouns ("this one", "that", "same", "it") refer to the ACTIVE product.
4. Switching ("what about adidas?", "do you have socks?") means PRODUCT_SWITCH or PRODUCT_SEARCH.
5. Vague requests ("show me something good", "something for college", "something under 4000") without specific product/category must NOT guess shoes/socks. Classify as AMBIGUOUS with confidence < 0.8.
6. Extract requestedPrice if the user specifies a target price in ₹.
7. NEVER invent categories or products not in the catalog.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "intent": "PRODUCT_SEARCH" | "PRODUCT_QUESTION" | "PRICE_NEGOTIATION" | "ACCEPT_OFFER" | "REJECT_OFFER" | "PURCHASE_INTENT" | "PAYMENT_REQUEST" | "PAYMENT_RETRY" | "CANCELLATION" | "PRODUCT_SWITCH" | "FOLLOW_UP" | "SMALL_TALK" | "AMBIGUOUS",
  "referencedProductTitle": string | null,
  "referencedVariantId": string | null,
  "requestedPrice": number | null,
  "extractedBudget": number | null,
  "category": string | null,
  "brand": string | null,
  "confidence": number,
  "isAffirmative": boolean,
  "isNegative": boolean,
  "isPhotoRequest": boolean,
  "rawReasoning": string
}`;

  // ── 5. Query LLM (Qwen 3.6 27B -> GPT-OSS 120B -> Gemini) ────────────────
  const groq = getGroqClient();
  if (groq) {
    const models = ["qwen/qwen3.6-27b", "openai/gpt-oss-120b"];
    for (const m of models) {
      try {
        const chat = await groq.chat.completions.create({
          model: m,
          messages: [
            { role: "system", content: "You are a precise JSON intent parsing engine. Output ONLY raw JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        });

        let raw = chat.choices[0]?.message?.content?.trim() || "";
        raw = raw.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.intent) {
            return {
              intent: parsed.intent as ConversationIntentType,
              referencedProductTitle: parsed.referencedProductTitle || state.activeProduct?.title,
              referencedVariantId: parsed.referencedVariantId || state.activeProduct?.variantId,
              requestedPrice: parsed.requestedPrice ? Number(parsed.requestedPrice) : undefined,
              extractedBudget: parsed.extractedBudget ? Number(parsed.extractedBudget) : (extractBudgetFromText(userMessage) || undefined),
              category: parsed.category || undefined,
              brand: parsed.brand || undefined,
              confidence: parsed.confidence ?? 0.9,
              isAffirmative: parsed.isAffirmative ?? false,
              isNegative: parsed.isNegative ?? false,
              isPhotoRequest: isPhotoRequest || (parsed.isPhotoRequest ?? false),
              rawReasoning: parsed.rawReasoning,
            };
          }
        }
      } catch (err) {
        console.warn(`[IntentResolver] ${m} fallback:`, (err as any)?.message);
      }
    }
  }

  // ── 6. Deterministic Context-First Fallback ────────────────────────────────
  return fallbackIntentResolution(userMessage, context, isPhotoRequest);
}

function fallbackIntentResolution(
  message: string,
  context: ConversationContext,
  isPhotoRequest: boolean
): ConversationIntent {
  const lower = message.toLowerCase().trim();
  const { state, availableProducts } = context;

  // Check extracted price/budget
  const extractedBudget = extractBudgetFromText(message);

  // Short affirmative check
  const isAffirmative = /^(yes|yeah|yep|sure|proceed|ok|okay|y|deal|buy it|send link|i want this|take it|let's do it|go ahead|send it)$/i.test(lower);
  const isNegative = /^(no|nah|nope|not interested|too expensive|too much|cancel|don't want)$/i.test(lower);
  const isPriceAsk = /cheaper|less|discount|lower|best price|counter|can you do|reduce|margin/i.test(lower);

  // If there's an active product and user confirms
  if (isAffirmative && state.activeProduct) {
    return {
      intent: "ACCEPT_OFFER",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      confidence: 0.95,
      isAffirmative: true,
    };
  }

  if (isNegative) {
    return {
      intent: "REJECT_OFFER",
      referencedProductTitle: state.activeProduct?.title,
      confidence: 0.9,
      isNegative: true,
    };
  }

  // If asking for lower price on active product
  if (isPriceAsk && state.activeProduct) {
    return {
      intent: "PRICE_NEGOTIATION",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      requestedPrice: extractedBudget || undefined,
      confidence: 0.9,
    };
  }

  // Check for greetings
  if (/^(hi|hello|hey|greetings|good morning|good evening|yo)$/i.test(lower)) {
    return {
      intent: "SMALL_TALK",
      confidence: 0.95,
    };
  }

  // Check if user specifically named a catalog product
  const matchedProd = availableProducts.find((p) =>
    lower.includes(p.title.toLowerCase()) || (p.sku && lower.includes(p.sku.toLowerCase()))
  );

  if (matchedProd) {
    return {
      intent: isPhotoRequest ? "PRODUCT_QUESTION" : "PRODUCT_SEARCH",
      referencedProductTitle: matchedProd.title,
      referencedVariantId: matchedProd.shopifyVariantId,
      extractedBudget: extractedBudget || undefined,
      isPhotoRequest,
      confidence: 0.9,
    };
  }

  // Check photo request on active product
  if (isPhotoRequest && state.activeProduct) {
    return {
      intent: "PRODUCT_QUESTION",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      isPhotoRequest: true,
      confidence: 0.9,
    };
  }

  // If user says something vague without specific product
  if (/something good|something nice|show me items|what do you have|for college|surprise me/i.test(lower)) {
    return {
      intent: "AMBIGUOUS",
      confidence: 0.5,
    };
  }

  return {
    intent: extractedBudget ? "PRODUCT_SEARCH" : "AMBIGUOUS",
    referencedProductTitle: state.activeProduct?.title,
    referencedVariantId: state.activeProduct?.variantId,
    extractedBudget: extractedBudget || undefined,
    confidence: 0.6,
  };
}

export function extractBudgetFromText(message: string): number | null {
  const patterns = [
    /(?:under|below|within|max|upto|up to|budget|less than)\s*[₹rs.]?\s*([\d,]+)/i,
    /[₹rs.]\s*([\d,]+)/i,
    /([\d,]+)\s*(?:rupees|rs|inr)/i,
    /\b(\d{3,6})\b/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > 100 && num < 1000000) return num;
    }
  }
  return null;
}
