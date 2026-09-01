import { getGroqClient } from "../../integrations/llm/index.ts";
import { getProducts, getNegotiationRules, getStore } from "../../services/merchant.ts";
import { computeSellerCounterOffer, getStrategyPersonaHint } from "./negotiation-strategy.ts";
import type { NegotiationRules, SellerOffer, AgentProductSchema } from "@zapai/types";
import { logger } from "../../core/logger/index.ts";

export interface SellerQuery {
  buyerQuery: string;
  targetPrice?: number;
  category?: string;
  sessionId: string;
  /** Current negotiation round for this product (0 = first ask). */
  negotiationRound?: number;
  /** Last price the seller quoted — for concession-lock enforcement. */
  lastSellerPrice?: number;
}

export class SellerAgent {
  private storeId: string;

  constructor(storeId: string) {
    this.storeId = storeId;
  }

  async handleQuery(query: SellerQuery): Promise<SellerOffer | null> {
    const [products, rules, store] = await Promise.all([
      getProducts(this.storeId),
      getNegotiationRules(this.storeId),
      getStore(this.storeId),
    ]);

    if (products.length === 0 || !rules || !store) return null;

    try {
      const groq = getGroqClient();
      if (!groq) {
        throw new Error("GROQ_API_KEY is not configured");
      }

          const catalogJson = JSON.stringify(products.map((p) => p.agentSchema), null, 2);

      // Compute what tranche the AI is allowed to offer this round.
      const currentRound = query.negotiationRound ?? 0;
      const isBuyerNegotiating = query.targetPrice !== undefined;

      // For A2A / product-search, pick the first matched product to compute tranche.
      // The LLM will do the actual product selection; we just need a representative tranche.
      const representativeProduct = products[0];
      const repListed = representativeProduct?.listedPrice || representativeProduct?.price || 999;
      const repFloor = representativeProduct?.floorPrice ?? 0;
      const repMaxDiscount = rules.maxDiscountPercentage || 10;

      let trancheInstruction: string;
      if (!isBuyerNegotiating) {
        trancheInstruction = "The buyer is browsing / searching, NOT negotiating price. Offer at the STANDARD LISTED PRICE only.";
      } else {
        const tranche = computeSellerCounterOffer({
          listedPrice: repListed,
          floorPrice: repFloor,
          maxDiscountPct: repMaxDiscount,
          currentRound,
          lastSellerPrice: query.lastSellerPrice,
          buyerOfferedPrice: query.targetPrice,
          buyerMessage: query.buyerQuery,
        });
        const personaHint = getStrategyPersonaHint(tranche.strategyLabel);
        // IMPORTANT: tell the LLM the EXACT counter price, not just a floor.
        // Saying "do not go below" lets the LLM pick a number ABOVE the last offer,
        // which violates the concession-lock (price must never go UP).
        const ceilingNote = query.lastSellerPrice !== undefined
          ? `\n- Your last quoted price was ₹${query.lastSellerPrice}. You MUST NOT quote higher than ₹${query.lastSellerPrice} — price can only stay flat or go down.`
          : "";
        trancheInstruction = `Negotiation round ${currentRound}. Strategy: ${tranche.strategyLabel}.
- You MUST offer exactly ₹${tranche.counterPrice} for this product. Do not deviate from this price.${ceilingNote}
- Persona directive: ${personaHint}
- NEVER jump straight to floor price unless the strategy is FLOOR.`;
      }

      const systemPrompt = `You are an AI Seller Agent for ${store.name} in ${store.city}.

STORE INVENTORY CATALOG:
${catalogJson}

NEGOTIATION RULES & BOUNDS:
- Max discount allowed: ${rules.maxDiscountPercentage}%
- Minimum order value for discount: ₹${rules.minOrderValueForDiscount}
- Free shipping threshold: ₹${rules.freeShippingThreshold ?? "N/A"}

MULTI-ROUND NEGOTIATION DIRECTIVE:
${trancheInstruction}

MATCHING & PRICING MANDATES:
1. Product Category Match: Match the specific item requested by the buyer.
2. Pricing Strategy:
   - Follow the MULTI-ROUND NEGOTIATION DIRECTIVE above exactly.
   - NEVER give the full max discount in round 0. Start at listed price or the allowed tranche.
   - Hard Floor Limit: NEVER offer below the product's floorPrice.
3. Free Shipping: Set shippingFree = true if the offered price >= ${rules.freeShippingThreshold || 999999}.
4. Currency: Strictly use Indian Rupees (₹). NEVER use dollars ($) or USD.

You MUST call the selectProduct function with your choice.`;

      let response;
      try {
        response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Buyer query: "${query.buyerQuery}"${query.targetPrice ? `, target price: ₹${query.targetPrice}` : ""}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "selectProduct",
                description: "Select product to offer and determine negotiated price",
                parameters: {
                  type: "object",
                  properties: {
                    variantId: { type: "string", description: "The variantId from catalog" },
                    offeredPrice: { type: "number", description: "Offered price in INR (must be >= floorPrice)" },
                    reasoningTrace: { type: "string", description: "Brief explanation of price and product choice" },
                  },
                  required: ["variantId", "offeredPrice", "reasoningTrace"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "selectProduct" } },
          temperature: 0.1,
          max_tokens: 500,
        });
      } catch (err: any) {
        logger.warn({ err: err.message }, "⚠️ LLaMA 3.3 70B failed, falling back to LLaMA 3.1 8B");
        response = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Buyer query: "${query.buyerQuery}"${query.targetPrice ? `, target price: ₹${query.targetPrice}` : ""}` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "selectProduct",
                description: "Select product to offer and determine negotiated price",
                parameters: {
                  type: "object",
                  properties: {
                    variantId: { type: "string", description: "The variantId from catalog" },
                    offeredPrice: { type: "number", description: "Offered price in INR (must be >= floorPrice)" },
                    reasoningTrace: { type: "string", description: "Brief explanation of price and product choice" },
                  },
                  required: ["variantId", "offeredPrice", "reasoningTrace"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "selectProduct" } },
          temperature: 0.1,
          max_tokens: 500,
        });
      }

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall) return this.fallbackMatch(products, rules, query);

      const args = JSON.parse(toolCall.function.arguments) as {
        variantId: string;
        offeredPrice: number;
        reasoningTrace: string;
      };

      const selected = products.find(
        (p) => p.shopifyVariantId === args.variantId
      );
      if (!selected) return this.fallbackMatch(products, rules, query);

      // A buyer has "negotiated" only if they explicitly sent a target price below listed.
      // Simple purchase intent ("I need 2 X") must never receive an unprompted discount.
      const listedPrice = selected.listedPrice || selected.price || 999;
      const buyerNegotiated = query.targetPrice !== undefined && query.targetPrice < listedPrice;

      const validatedPrice = this.applyPricingRules(
        listedPrice,
        selected.floorPrice ?? 0,
        args.offeredPrice,
        rules,
        buyerNegotiated,
        query.lastSellerPrice
      );

      const freeShipping = Boolean(
        rules.freeShippingThreshold && validatedPrice >= rules.freeShippingThreshold
      );

      return {
        status: "PROPOSE",
        product: selected.agentSchema || {
          variantId: selected.shopifyVariantId || selected.id,
          title: selected.title,
          sku: selected.sku,
          listedPrice,
          floorPrice: selected.floorPrice ?? 0,
          inventoryAvailable: selected.inventoryAvailable || 10,
          attributes: {},
        },
        offeredPrice: validatedPrice,
        shippingFree: freeShipping,
        reasoningTrace: buyerNegotiated
          ? args.reasoningTrace
          : `Offered ${selected.title} at standard listed price ₹${validatedPrice}.`,
        sessionId: query.sessionId,
      };
    } catch (err) {
      logger.warn({ err }, "[SellerAgent] LLM failed, using deterministic fallback");
      return this.fallbackMatch(products, rules, query);
    }
  }

  private fallbackMatch(
    products: any[],
    rules: NegotiationRules,
    query: SellerQuery
  ): SellerOffer | null {
    const qLower = query.buyerQuery.toLowerCase();
    const isShoeQuery = /shoe|runner|running|pegasus|nike|sneaker|footwear/i.test(qLower);
    const isSockQuery = /sock|accessories|dri-fit/i.test(qLower);
    const isWatchQuery = /watch|garmin|gps|tracker|wearable/i.test(qLower);

    let match = products.find((p) => {
      const title = p.title.toLowerCase();
      const cat = (p.agentSchema?.attributes?.category ?? "").toLowerCase();
      if (isShoeQuery && (title.includes("pegasus") || title.includes("shoe") || cat.includes("running"))) return true;
      if (isSockQuery && (title.includes("sock") || cat.includes("accessories"))) return true;
      if (isWatchQuery && (title.includes("forerunner") || title.includes("watch") || cat.includes("wearables"))) return true;
      return qLower.split(" ").some((w) => w.length > 3 && (title.includes(w) || cat.includes(w)));
    });

    if (!match && isShoeQuery) {
      match = products.find((p) => p.title.toLowerCase().includes("pegasus") || p.title.toLowerCase().includes("shoe"));
    }

    if (!match) match = products[0];
    if (!match) return null;

    const maxDiscount = rules.maxDiscountPercentage || 10;
    const listedPrice = match.listedPrice || match.price || 999;
    const floorPrice = match.floorPrice ?? 0;
    const targetPrice = query.targetPrice;

    let offeredPrice = listedPrice;
    const isDiscountRequested = /discount|less|cheaper|lower|deal|offer|bargain|reduce|margin|budget|best price/i.test(qLower);
    if (targetPrice && targetPrice < listedPrice) {
      const minAllowed = Math.max(floorPrice, Math.round(listedPrice * (1 - maxDiscount / 100)));
      offeredPrice = Math.max(targetPrice, minAllowed);
    } else if (isDiscountRequested) {
      offeredPrice = Math.max(floorPrice, Math.round(listedPrice * (1 - maxDiscount / 100)));
    } else {
      offeredPrice = listedPrice;
    }

    const freeShipping = Boolean(
      rules.freeShippingThreshold && offeredPrice >= rules.freeShippingThreshold
    );

    return {
      status: "PROPOSE",
      product: match.agentSchema || {
        variantId: match.shopifyVariantId || match.id,
        title: match.title,
        sku: match.sku,
        listedPrice,
        floorPrice,
        inventoryAvailable: match.inventoryAvailable || 10,
        attributes: {},
      },
      offeredPrice,
      shippingFree: freeShipping,
      reasoningTrace: `Offered ${match.title} at ${offeredPrice < listedPrice ? "discounted" : "standard"} price ₹${offeredPrice} (listed ₹${listedPrice}, floor ₹${floorPrice})`,
      sessionId: query.sessionId,
    };
  }

  private applyPricingRules(
    listedPrice: number,
    floorPrice: number,
    suggestedPrice: number,
    rules: NegotiationRules,
    buyerNegotiated: boolean = false,
    lastSellerPrice?: number
  ): number {
    // If the buyer did NOT explicitly negotiate a price, always charge the
    // full listed price. Never apply an unprompted discount.
    if (!buyerNegotiated) {
      return Math.round(listedPrice);
    }

    // The DB floorPrice is the merchant's hard absolute minimum — it must always win.
    // The max-discount % is a secondary rule: it prevents discounting MORE than allowed,
    // but can never override the DB floor downwards or upwards.
    // Correct logic:
    //   effectiveFloor = floorPrice  (the DB value is sovereign)
    //   then clamp the offered price to [effectiveFloor, listedPrice]
    const effectiveFloor = floorPrice; // DB floor wins — not the %-based cap
    const clampedPrice = Math.max(effectiveFloor, Math.min(listedPrice, suggestedPrice));

    // Concession-lock: the seller must NEVER quote a price higher than what
    // was already offered in a previous round. If the LLM ignores the system
    // prompt and returns a higher number, clamp it down here as a safety net.
    const concessionLocked =
      lastSellerPrice !== undefined
        ? Math.min(lastSellerPrice, clampedPrice)
        : clampedPrice;

    return Math.round(concessionLocked);
  }
}
