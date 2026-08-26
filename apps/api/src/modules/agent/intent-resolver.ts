import { getGroqClient, getGeminiClient } from "../../integrations/llm/index.ts";
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

  // ── 2. Explicit Greetings (Reset Stale Focus) ─────────────────────────────
  const isPureGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo|namaste|hola)(\s*[!👋😊]*)?$/i.test(rawLower);
  if (isPureGreeting) {
    return {
      intent: "SMALL_TALK",
      confidence: 1.0,
      referencedProductTitle: undefined,
    };
  }

  // ── 3. Check for Photo / Picture Request ───────────────────────────────────
  const isPhotoRequest = /picture|photo|image|pic|look like|show me|shw me|show.*pic|shw.*pic|photos|pics|send.*pic|send.*photo|send.*image/i.test(rawLower);

  // ── 4. Check for Catalog Browsing & Store Description ───────────────────────
  const isCatalogAsk = /catalog|what do (you|u) sell|what (do|does) (this|the|your|u|you|mvpfast) sell|what products|show products|all products|list products|menu|collection|browse|what (items|goods) do (you|u) have|what do (you|u) have/i.test(rawLower);
  if (isCatalogAsk) {
    return {
      intent: "CATALOG_BROWSE",
      confidence: 0.98,
    };
  }

  // ── 4.1 Check for quantity expression ("i will get 2 rohann", "i want 2", "2 units", "buy 2", "qty 2", "2") ──
  const isStockAsk = /how many (qty|quantity|units|pieces|items)? (are )?available|how much stock|in stock|qty available|available qty/i.test(rawLower);

  const qtyMatch = !isStockAsk ? rawLower.match(/(?:i (?:will )?(?:get|take|want|buy|need|order)|buy|need|order|take|give me|send|get)\s+(\d+)|(\d+)\s*(?:units|qty|quantity|pieces|items|pairs|nos)|^\s*(\d+)\s*$/i) : null;
  let extractedQuantity: number | undefined;
  if (qtyMatch) {
    const val = parseInt(qtyMatch[1] || qtyMatch[2] || qtyMatch[3], 10);
    if (!isNaN(val) && val > 0 && val < 1000) {
      extractedQuantity = val;
    }
  }

  // Check direct product name match in catalog
  const exactProductMatch = availableProducts.find((p) => {
    const tLower = p.title.toLowerCase().trim();
    const cleanTokens = tLower.split(/\s+/);
    const rawTokens = rawLower.split(/\s+/);
    return (
      tLower === rawLower ||
      rawLower.includes(tLower) ||
      (rawLower.length >= 3 && tLower.includes(rawLower)) ||
      rawTokens.some((rt) => rt.length >= 3 && cleanTokens.some((ct) => ct.startsWith(rt) || rt.startsWith(ct)))
    );
  });

  // If user specifies quantity with product name or on active product ("i will get 2 rohann", "i want 2")
  if (extractedQuantity && !isStockAsk) {
    const targetProd =
      exactProductMatch ||
      (state.activeProduct
        ? availableProducts.find(
            (p) =>
              p.shopifyVariantId === state.activeProduct?.variantId ||
              p.title.toLowerCase().trim() === state.activeProduct?.title.toLowerCase().trim()
          )
        : undefined) ||
      availableProducts[0];

    if (targetProd) {
      return {
        intent: "ACCEPT_OFFER",
        referencedProductTitle: targetProd.title,
        referencedVariantId: targetProd.shopifyVariantId,
        requestedQuantity: extractedQuantity,
        confidence: 0.96,
        isAffirmative: true,
      };
    }
  }

  // Pure product query without purchase quantity
  if (exactProductMatch && !isPhotoRequest && !isStockAsk && rawLower === exactProductMatch.title.toLowerCase().trim()) {
    return {
      intent: "PRODUCT_SEARCH",
      referencedProductTitle: exactProductMatch.title,
      referencedVariantId: exactProductMatch.shopifyVariantId,
      confidence: 0.95,
    };
  }

  // ── 5. Context-driven Short Confirmations ("yes", "ok", "deal", "sure") ──
  const isAffirmative = /^(yes|yeah|yep|sure|proceed|ok|okay|y|deal|buy it|send link|send payment link|i want this|take it|let's do it|go ahead|send it|please send)$/i.test(rawLower);

  // If user previously asked/offered catalog and replies "yes"
  if (isAffirmative && state.awaitingConfirmation === "CATALOG") {
    return {
      intent: "CATALOG_BROWSE",
      confidence: 0.95,
    };
  }

  // If affirmative and an active product exists in context ("yes", "proceed")
  if (isAffirmative && state.activeProduct) {
    return {
      intent: "ACCEPT_OFFER",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      requestedQuantity: state.requestedQuantity || 1,
      confidence: 0.95,
      isAffirmative: true,
    };
  }

  // ── 6. Build compact grounded catalog context ─────────────────────────────
  const catalogSummary = availableProducts.slice(0, 15).map((p) => ({
    id: p.id,
    variantId: p.shopifyVariantId,
    title: p.title,
    sku: p.sku,
    listedPrice: p.listedPrice,
    floorPrice: p.floorPrice,
    inStock: (p.inventoryAvailable || 0) > 0,
    category: p.agentSchema?.attributes?.category || "General",
  }));

  // ── 7. Build prompt with active conversation context ──────────────────────
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
- Products Mentioned in Conversation: ${state.productsDiscussed?.map((p: any) => p.title).join(", ") || "None"}
- Last User Intent: ${state.lastIntent || "None"}
- Awaiting Confirmation: ${state.awaitingConfirmation || "None"}

RECENT CHAT TRANSCRIPT:
${recentTranscriptText || "No prior messages."}

STORE CATALOG (All Available SKUs):
${JSON.stringify(catalogSummary, null, 2)}

INBOUND USER MESSAGE:
"${userMessage}"

TASK:
Determine the accurate intent and resolve any pronouns ("this", "that", "same one", "cheaper", "anything less", "show me pic", "yes", "okay", "send link").

RULES:
1. Greetings ("hi", "hello", "hey") MUST be classified as SMALL_TALK without referencing any previous product.
2. If the user asks to see the catalog / all products or says "yes" to seeing the catalog, classify as CATALOG_BROWSE.
3. If the user asks for a picture / photo ("show me pic", "send rohan picture", "what does it look like"), classify as PRODUCT_QUESTION with isPhotoRequest=true.
4. If asking for a discount or cheaper price ("any discounts?", "anything less", "can you do 3500?", "best price?"), classify as PRICE_NEGOTIATION on the ACTIVE product.
5. Short affirmative replies ("yes", "ok", "sure", "deal", "send link", "buy it", "go ahead") when an active offer or product is discussed mean ACCEPT_OFFER or PAYMENT_REQUEST for the ACTIVE product.
6. Pronouns ("this one", "that", "same", "it") refer to the ACTIVE product.
7. Switching ("what about adidas?", "do you have socks?") means PRODUCT_SWITCH or PRODUCT_SEARCH.
8. Vague requests ("show me something good", "something for college") without specific product/category must NOT guess shoes/socks. Classify as AMBIGUOUS.
9. Extract requestedPrice if the user specifies a target price in ₹.
10. NEVER invent categories or products not in the catalog.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "intent": "PRODUCT_SEARCH" | "CATALOG_BROWSE" | "PRODUCT_QUESTION" | "PRICE_NEGOTIATION" | "ACCEPT_OFFER" | "REJECT_OFFER" | "PURCHASE_INTENT" | "PAYMENT_REQUEST" | "PAYMENT_RETRY" | "CANCELLATION" | "PRODUCT_SWITCH" | "FOLLOW_UP" | "SMALL_TALK" | "AMBIGUOUS",
  "referencedProductTitle": string | null,
  "referencedVariantId": string | null,
  "requestedPrice": number | null,
  "extractedBudget": number | null,
  "requestedQuantity": number | null,
  "category": string | null,
  "brand": string | null,
  "confidence": number,
  "isAffirmative": boolean,
  "isNegative": boolean,
  "isPhotoRequest": boolean,
  "rawReasoning": string
}`;

  // ── 8. Query LLM (Qwen 3.6 27B -> GPT-OSS 120B) ───────────────────────────
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
              referencedProductTitle: parsed.referencedProductTitle || (parsed.intent !== "SMALL_TALK" ? state.activeProduct?.title : undefined),
              referencedVariantId: parsed.referencedVariantId || (parsed.intent !== "SMALL_TALK" ? state.activeProduct?.variantId : undefined),
              requestedPrice: parsed.requestedPrice ? Number(parsed.requestedPrice) : undefined,
              extractedBudget: parsed.extractedBudget ? Number(parsed.extractedBudget) : (extractBudgetFromText(userMessage) || undefined),
              requestedQuantity: parsed.requestedQuantity ? Number(parsed.requestedQuantity) : undefined,
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
        // fallback
      }
    }
  }

  // ── 9. Deterministic Context-First Fallback ────────────────────────────────
  return fallbackIntentResolution(userMessage, context, isPhotoRequest);
}

function fallbackIntentResolution(
  message: string,
  context: ConversationContext,
  isPhotoRequest: boolean
): ConversationIntent {
  const lower = message.toLowerCase().trim();
  const { state, availableProducts } = context;

  const extractedBudget = extractBudgetFromText(message);
  const isAffirmative = /^(yes|yeah|yep|sure|proceed|ok|okay|y|deal|buy it|send link|send payment link|i want this|take it|let's do it|go ahead|send it)$/i.test(lower);
  const isNegative = /^(no|nah|nope|not interested|too expensive|too much|cancel|don't want)$/i.test(lower);
  const isPriceAsk = /any discount|anything less|any deal|cheaper|less|discount|lower|best price|counter|can you do|reduce|margin|rock bottom/i.test(lower);

  if (isAffirmative && state.activeProduct) {
    return {
      intent: "ACCEPT_OFFER",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      requestedQuantity: state.requestedQuantity || 1,
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

  if (isPriceAsk && state.activeProduct) {
    return {
      intent: "PRICE_NEGOTIATION",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      requestedPrice: extractedBudget || undefined,
      confidence: 0.9,
    };
  }

  const matchedProd = availableProducts.find((p) => {
    const tLower = p.title.toLowerCase().trim();
    const cleanTokens = tLower.split(/\s+/);
    const rawTokens = lower.split(/\s+/);
    return (
      lower.includes(tLower) ||
      (p.sku && lower.includes(p.sku.toLowerCase())) ||
      rawTokens.some((rt) => rt.length >= 3 && cleanTokens.some((ct) => ct.startsWith(rt) || rt.startsWith(ct)))
    );
  });

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

  if (isPhotoRequest && state.activeProduct) {
    return {
      intent: "PRODUCT_QUESTION",
      referencedProductTitle: state.activeProduct.title,
      referencedVariantId: state.activeProduct.variantId,
      isPhotoRequest: true,
      confidence: 0.9,
    };
  }

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
