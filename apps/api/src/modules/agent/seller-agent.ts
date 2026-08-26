import { getGroqClient } from "../../integrations/llm/index.ts";
import { getProducts, getNegotiationRules, getStore } from "../../services/merchant.ts";
import type { NegotiationRules, SellerOffer, AgentProductSchema } from "@zapai/types";
import { logger } from "../../core/logger/index.ts";

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
5. Currency: Strictly use Indian Rupees (₹). NEVER use dollars ($) or USD.

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

      const validatedPrice = this.applyPricingRules(
        selected.listedPrice || selected.price || 999,
        selected.floorPrice || selected.minPrice || 800,
        args.offeredPrice,
        rules
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
          listedPrice: selected.listedPrice || selected.price || 999,
          floorPrice: selected.floorPrice || selected.minPrice || 800,
          inventoryAvailable: selected.inventoryAvailable || 10,
          attributes: {},
        },
        offeredPrice: validatedPrice,
        shippingFree: freeShipping,
        reasoningTrace: args.reasoningTrace,
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
    const floorPrice = match.floorPrice || match.minPrice || 800;
    const targetPrice = query.targetPrice;

    let offeredPrice = listedPrice;
    if (targetPrice && targetPrice < listedPrice) {
      const minAllowed = Math.max(floorPrice, Math.round(listedPrice * (1 - maxDiscount / 100)));
      offeredPrice = Math.max(targetPrice, minAllowed);
    } else {
      offeredPrice = Math.max(floorPrice, Math.round(listedPrice * (1 - maxDiscount / 100)));
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
      reasoningTrace: `Matched ${match.title} at discounted price ₹${offeredPrice} (listed ₹${listedPrice}, floor ₹${floorPrice})`,
      sessionId: query.sessionId,
    };
  }

  private applyPricingRules(
    listedPrice: number,
    floorPrice: number,
    suggestedPrice: number,
    rules: NegotiationRules
  ): number {
    const maxDiscountPrice = Math.round(
      listedPrice * (1 - (rules.maxDiscountPercentage || 10) / 100)
    );
    const absoluteFloor = Math.max(floorPrice, maxDiscountPrice);
    const clampedPrice = Math.max(absoluteFloor, Math.min(listedPrice, suggestedPrice));
    return Math.round(clampedPrice);
  }
}
