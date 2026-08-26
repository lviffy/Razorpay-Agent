import { getGroqClient } from "../services/ai.ts";
import { getProducts, getNegotiationRules, getStore } from "../services/merchant.ts";
import type { NegotiationRules, SellerOffer, AgentProductSchema } from "../types/index.ts";

// ───────────────────────────────────────────────────────────────────────────────
// Seller Agent — per-store catalog + pricing service with Groq/Llama 3.1 8B reasoning
// One counter-offer max. Reliable > impressive.
// ───────────────────────────────────────────────────────────────────────────────

export interface SellerQuery {
  buyerQuery: string;
  targetPrice?: number;
  category?: string;
  sessionId: string;
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

      const systemPrompt = `You are an AI Seller Agent for ${store.name} in ${store.city}.

STORE INVENTORY CATALOG:
${catalogJson}

NEGOTIATION RULES & BOUNDS:
- Max discount allowed: ${rules.maxDiscountPercentage}%
- Minimum order value for discount: ₹${rules.minOrderValueForDiscount}
- Free shipping threshold: ₹${rules.freeShippingThreshold ?? "N/A"}

MATCHING & PRICING MANDATES:
1. Product Category Match: Match the specific item requested by the buyer.
2. Pricing & Negotiation: Apply discounts up to ${rules.maxDiscountPercentage}% off listed price to win the deal.
3. Hard Floor Limit: NEVER offer below the product's floorPrice. NEVER exceed max discount.
4. Free Shipping: Set shippingFree = true if the offered price >= ${rules.freeShippingThreshold || 999999}.

You MUST call the selectProduct function with your choice.`;

      let response;
      const models = [
        "qwen/qwen3.8-27b",
        "groq/compound-mini",
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ];
      for (const m of models) {
        try {
          response = await groq.chat.completions.create({
            model: m,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Buyer Request: "${query.buyerQuery}"${query.targetPrice ? `\nBuyer Budget Limit: ₹${query.targetPrice}` : ""}` },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "selectProduct",
                  description: "Select the best matching product from the catalog and determine the best offer price",
                  parameters: {
                    type: "object",
                    properties: {
                      variantId: { type: "string", description: "The shopify_variant_id of the selected product" },
                      offeredPrice: { type: "number", description: "The price to offer in rupees. Must be >= floorPrice and <= listedPrice." },
                      shippingFree: { type: "boolean", description: "Whether to offer free shipping" },
                      reasoning: { type: "string", description: "Brief reasoning for this offer" },
                    },
                    required: ["variantId", "offeredPrice", "shippingFree", "reasoning"],
                  },
                },
              },
            ],
            tool_choice: "required",
            temperature: 0.3,
            max_tokens: 512,
          });
          if (response?.choices[0]?.message?.tool_calls?.length) break;
        } catch {
          // continue to next model
        }
      }

      const toolCall = response?.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.name === "selectProduct") {
        const args = JSON.parse(toolCall.function.arguments) as {
          variantId: string;
          offeredPrice: number;
          shippingFree: boolean;
          reasoning: string;
        };

        const selectedProduct = products.find(
          (p) => p.agentSchema.variantId === args.variantId
        );

        if (selectedProduct) {
          const offeredPrice = Math.max(args.offeredPrice, selectedProduct.floorPrice);
          return {
            status: "PROPOSE",
            product: selectedProduct.agentSchema,
            offeredPrice,
            shippingFree: args.shippingFree,
            reasoningTrace: args.reasoning,
            sessionId: query.sessionId,
          };
        }
      }
    } catch (err) {
      console.warn("⚠️ Gemini seller reasoning fallback active:", (err as any)?.message || err);
    }

    // High-precision deterministic catalog matching fallback
    const qLower = query.buyerQuery.toLowerCase();
    let candidates = products.filter((p) => p.agentSchema.inventoryAvailable > 0);

    const isShoeQuery = qLower.includes("shoe") || qLower.includes("sneaker") || qLower.includes("runner") || qLower.includes("pegasus") || qLower.includes("ultraboost") || qLower.includes("nitro");
    const isSockQuery = qLower.includes("sock");

    if (isShoeQuery) {
      candidates = candidates.filter((c) => 
        !c.agentSchema.title.toLowerCase().includes("sock") &&
        (c.agentSchema.attributes?.category?.toLowerCase().includes("shoe") || c.agentSchema.title.toLowerCase().includes("shoe") || c.agentSchema.title.toLowerCase().includes("pegasus") || c.agentSchema.title.toLowerCase().includes("ultraboost") || c.agentSchema.title.toLowerCase().includes("nitro"))
      );
    } else if (isSockQuery) {
      candidates = candidates.filter((c) => c.agentSchema.title.toLowerCase().includes("sock"));
    }

    // Brand filtering
    if (qLower.includes("nike")) {
      const p = candidates.filter((c) => c.agentSchema.title.toLowerCase().includes("nike"));
      if (p.length > 0) candidates = p;
    } else if (qLower.includes("adidas")) {
      const p = candidates.filter((c) => c.agentSchema.title.toLowerCase().includes("adidas"));
      if (p.length > 0) candidates = p;
    } else if (qLower.includes("puma")) {
      const p = candidates.filter((c) => c.agentSchema.title.toLowerCase().includes("puma"));
      if (p.length > 0) candidates = p;
    }

    if (candidates.length === 0) return null;

    // Pick best matching product
    const selected = candidates[0];
    const maxDiscount = (rules.maxDiscountPercentage || 0) / 100;
    const minAllowed = selected.agentSchema.listedPrice * (1 - maxDiscount);
    const floorPrice = selected.floorPrice;

    // Target price negotiation
    let offeredPrice = selected.agentSchema.listedPrice;
    if (query.targetPrice && query.targetPrice < selected.agentSchema.listedPrice) {
      offeredPrice = Math.max(query.targetPrice, Math.max(minAllowed, floorPrice));
    } else {
      offeredPrice = Math.max(minAllowed, floorPrice);
    }

    const shippingFree = Boolean(
      rules.freeShippingThreshold && offeredPrice >= rules.freeShippingThreshold
    );

    return {
      status: "PROPOSE",
      product: selected.agentSchema,
      offeredPrice: Math.round(offeredPrice),
      shippingFree,
      reasoningTrace: `Offered ₹${Math.round(offeredPrice)} for ${selected.agentSchema.title} within ${rules.maxDiscountPercentage}% max discount guardrail.`,
      sessionId: query.sessionId,
    };
  }

  /**
   * Generate one counter-offer when buyer pushes for a better price.
   * This is the maximum negotiation depth — one counter only.
   */
  async generateCounter(
    product: AgentProductSchema,
    buyerTargetPrice: number,
    rules: NegotiationRules
  ): Promise<{ offeredPrice: number; shippingFree: boolean; reasoning: string }> {
    const maxDiscount = rules.maxDiscountPercentage / 100;
    const minAllowed = product.listedPrice * (1 - maxDiscount);
    const floorPrice = product.floorPrice;

    // Best we can do: apply max discount, but stay above floor
    const bestPrice = Math.max(minAllowed, floorPrice);

    // Offer free shipping if order qualifies
    const shippingFree =
      rules.freeShippingThreshold != null &&
      bestPrice >= rules.freeShippingThreshold;

    const reasoning =
      bestPrice <= buyerTargetPrice
        ? `Can offer ₹${bestPrice.toFixed(0)} (${rules.maxDiscountPercentage}% off)${shippingFree ? " + free shipping" : ""} — within budget.`
        : `Best offer is ₹${bestPrice.toFixed(0)}${shippingFree ? " + free shipping" : ""}. Below this is our cost floor.`;

    return {
      offeredPrice: Math.round(bestPrice),
      shippingFree,
      reasoning,
    };
  }

  /**
   * Autonomous cross-sell / upsell suggestion.
   * Fires after a deal is agreed. If the agreed price is below the free-shipping
   * threshold, finds the cheapest complementary add-on that closes the gap —
   * increasing AOV and unlocking free shipping for the buyer.
   * Returns null if no upsell opportunity exists (order already qualifies,
   * or no suitable add-on found).
   */
  async generateUpsell(
    primaryProduct: AgentProductSchema,
    agreedPrice: number,
    rules: NegotiationRules,
    allProducts: AgentProductSchema[]
  ): Promise<{
    product: AgentProductSchema;
    bundlePrice: number;
    savingsNote: string;
    upsellMessage: string;
  } | null> {
    if (!rules.allowBundleOffers) return null;
    if (!rules.freeShippingThreshold) return null;
    if (agreedPrice >= rules.freeShippingThreshold) return null; // already qualifies

    const gap = rules.freeShippingThreshold - agreedPrice;

    // Find complementary products: different item, in stock, priced close to the gap
    const candidates = allProducts.filter(
      (p) =>
        p.variantId !== primaryProduct.variantId &&
        p.inventoryAvailable > 0 &&
        p.floorPrice <= gap * 1.8 // give 80% headroom above gap
    );

    if (candidates.length === 0) return null;

    // Pick the candidate whose floor price is closest to the gap (maximises AOV unlock)
    const best = candidates.sort(
      (a, b) => Math.abs(a.floorPrice - gap) - Math.abs(b.floorPrice - gap)
    )[0];

    const bundlePrice = best.floorPrice;
    const totalAfterBundle = agreedPrice + bundlePrice;
    const shippingSaving = 150; // standard courier saving in INR

    return {
      product: best,
      bundlePrice,
      savingsNote: `+₹${shippingSaving} shipping saved`,
      upsellMessage:
        `🛍️ *Bundle Offer — Unlock Free Shipping!*\n\n` +
        `Add *${best.title}* for just ₹${bundlePrice.toLocaleString("en-IN")} → ` +
        `your order total hits ₹${totalAfterBundle.toLocaleString("en-IN")}, ` +
        `qualifying for free express delivery (saves ₹${shippingSaving}).\n\n` +
        `Reply *YES* to add it, or proceed with your current order.`,
    };
  }
}
