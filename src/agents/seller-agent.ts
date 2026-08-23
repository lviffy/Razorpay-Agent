import { GoogleGenerativeAI, SchemaType, FunctionCallingMode } from "@google/generative-ai";
import { getProducts, getNegotiationRules, getStore } from "../services/merchant.ts";
import type { NegotiationRules, SellerOffer, AgentProductSchema } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Seller Agent — per-store catalog + pricing service with light LLM reasoning
// One counter-offer max. Reliable > impressive.
// ─────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      tools: [
        {
          functionDeclarations: [
            {
              name: "selectProduct",
              description:
                "Select the best matching product from the catalog and determine the best offer price",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  variantId: {
                    type: SchemaType.STRING,
                    description: "The shopify_variant_id of the selected product",
                  },
                  offeredPrice: {
                    type: SchemaType.NUMBER,
                    description:
                      "The price to offer in rupees. Must be >= floorPrice and <= listedPrice. Apply discount only if eligible per rules.",
                  },
                  shippingFree: {
                    type: SchemaType.BOOLEAN,
                    description:
                      "Whether to offer free shipping based on order value and store rules",
                  },
                  reasoning: {
                    type: SchemaType.STRING,
                    description:
                      "Brief reasoning for this offer — why this product, why this price",
                  },
                },
                required: ["variantId", "offeredPrice", "shippingFree", "reasoning"],
              },
            },
          ],
        },
      ],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    });

    const systemPrompt = `You are a Seller Agent for ${store.name} (${store.city}).

CATALOG:
${JSON.stringify(products.map((p) => p.agentSchema), null, 2)}

NEGOTIATION RULES:
- Max discount: ${rules.maxDiscountPercentage}%
- Minimum order for discount: ₹${rules.minOrderValueForDiscount}
- Free shipping threshold: ₹${rules.freeShippingThreshold ?? "N/A"}

Your goal: match the buyer's query to the best product and offer the best possible price within rules.
NEVER go below the floor price. NEVER exceed max discount.

Buyer query: "${query.buyerQuery}"
${query.targetPrice ? `Buyer target price: ₹${query.targetPrice}` : ""}`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const calls = response.functionCalls();

    if (!calls || calls.length === 0) return null;

    const call = calls[0];
    if (call.name !== "selectProduct") return null;

    const args = call.args as {
      variantId: string;
      offeredPrice: number;
      shippingFree: boolean;
      reasoning: string;
    };

    // Find the selected product
    const selectedProduct = products.find(
      (p) => p.agentSchema.variantId === args.variantId
    );
    if (!selectedProduct) return null;

    // Safety: enforce floor price
    const offeredPrice = Math.max(
      args.offeredPrice,
      selectedProduct.floorPrice
    );

    return {
      status: "PROPOSE",
      product: selectedProduct.agentSchema,
      offeredPrice,
      shippingFree: args.shippingFree,
      reasoningTrace: args.reasoning,
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
}
