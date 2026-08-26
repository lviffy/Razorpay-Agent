import { SchemaType, FunctionCallingMode } from "@google/generative-ai";
import { getGeminiClient } from "../services/ai.ts";
import { getAllStores, getNegotiationRules } from "../services/merchant.ts";
import { SellerAgent } from "./seller-agent.ts";
import { db } from "../db/migrate.ts";
import type { Mandate, SellerOffer } from "../types/index.ts";
import { v4 as uuidv4 } from "uuid";
import { createHmac } from "crypto";

export interface BuyerTask {
  message: string;           // Raw user message e.g. "Buy running shoes under ₹4,000"
  spendingLimit: number;     // Pre-authorized limit in rupees
  phoneNumber: string;       // For conversation tracking
  conversationId: string;
  waMessageId: string;
}

export interface BuyerDecision {
  accepted: boolean;
  offer?: SellerOffer;
  mandate?: Mandate;
  reasoning: string;
  escalateToUser?: boolean;  // true when all offers exceed spending limit
  escalationMessage?: string;
}

export class BuyerAgent {
  private buyerAgentId: string;

  constructor() {
    this.buyerAgentId = `agent_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
  }

  /**
   * Main entry: parse intent, create mandate, query both stores, evaluate.
   */
  async processTask(task: BuyerTask): Promise<BuyerDecision> {
    console.log(`[BuyerAgent] Processing task for ${task.phoneNumber}: "${task.message}"`);

    // Step 1: Parse intent with Gemini
    const intent = await this.parseIntent(task.message, task.spendingLimit);
    console.log(`[BuyerAgent] Intent:`, intent);

    // Step 2: Create AP2-inspired mandate
    const mandate = await this.createMandate({
      spendingLimit: task.spendingLimit,
      purpose: intent.category ?? "general purchase",
      conversationId: task.conversationId,
    });
    console.log(`[BuyerAgent] Mandate created: ${mandate.mandateId}`);

    // Step 3: Query both stores in parallel
    const stores = await getAllStores();
    console.log(`[BuyerAgent] Querying ${stores.length} stores in parallel...`);

    const offerResults = await Promise.allSettled(
      stores.map(async (store) => {
        const seller = new SellerAgent(store.id);
        const offer = await seller.handleQuery({
          buyerQuery: task.message,
          targetPrice: task.spendingLimit,
          category: intent.category,
          sessionId: uuidv4(),
        });
        return { store, offer };
      })
    );

    const validOffers: SellerOffer[] = [];
    for (const result of offerResults) {
      if (result.status === "fulfilled" && result.value.offer) {
        validOffers.push(result.value.offer);
        console.log(
          `[BuyerAgent] ${result.value.store.name}: ₹${result.value.offer.offeredPrice}`
        );
      }
    }

    if (validOffers.length === 0) {
      return {
        accepted: false,
        mandate,
        reasoning: "No matching products found across any store.",
      };
    }

    // Step 4: Negotiate — try to get better price from the best offer
    const bestOffer = validOffers.sort((a, b) => a.offeredPrice - b.offeredPrice)[0];

    if (bestOffer.offeredPrice > mandate.spendingLimit) {
      // Ask for counter from the cheapest store
      const storeForBest = stores.find(
        (s) =>
          validOffers.find(
            (o) => o.offeredPrice === bestOffer.offeredPrice && o.product.variantId === bestOffer.product.variantId
          ) !== undefined
      );

      if (storeForBest) {
        const rules = await getNegotiationRules(storeForBest.id);
        if (rules) {
          const seller = new SellerAgent(storeForBest.id);
          const counter = await seller.generateCounter(
            bestOffer.product,
            mandate.spendingLimit,
            rules
          );

          if (counter.offeredPrice <= mandate.spendingLimit) {
            const counterOffer: SellerOffer = {
              ...bestOffer,
              offeredPrice: counter.offeredPrice,
              shippingFree: counter.shippingFree,
              reasoningTrace: counter.reasoning,
              status: "COUNTER",
            };

            return {
              accepted: true,
              offer: counterOffer,
              mandate,
              reasoning: `Found best deal after negotiation: ₹${counter.offeredPrice} from ${bestOffer.product.title}. ${counter.reasoning}`,
            };
          }
        }
      }

      // All offers exceed limit — escalate
      return {
        accepted: false,
        mandate,
        reasoning: `Best available price ₹${bestOffer.offeredPrice} exceeds mandate limit ₹${mandate.spendingLimit}.`,
        escalateToUser: true,
        escalationMessage:
          `Found *${bestOffer.product.title}* at ₹${bestOffer.offeredPrice} — ` +
          `₹${bestOffer.offeredPrice - mandate.spendingLimit} over your budget of ₹${mandate.spendingLimit}.\n\n` +
          `Should I approve the extra spend?`,
      };
    }

    // Within budget — accept
    return {
      accepted: true,
      offer: bestOffer,
      mandate,
      reasoning: `Best offer ₹${bestOffer.offeredPrice} is within mandate limit ₹${mandate.spendingLimit}. Accepting.`,
    };
  }

  // ── Mandate enforcement guardrail ─────────────────────────────────────────

  canAuthorizePayment(amount: number, mandate: Mandate): boolean {
    if (mandate.status !== "ACTIVE") return false;
    if (new Date() > mandate.expiresAt) return false;
    if (amount > mandate.spendingLimit) return false;
    return true;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async parseIntent(
    message: string,
    spendingLimit: number
  ): Promise<{ category?: string; keywords: string[] }> {
    try {
      const genAI = getGeminiClient();
      if (!genAI) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        tools: [
          {
            functionDeclarations: [
              {
                name: "extractIntent",
                description: "Extract the shopping intent from the user message",
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    category: {
                      type: SchemaType.STRING,
                      description:
                        "Product category e.g. 'running shoes', 'socks', 'tee'",
                    },
                    keywords: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: "Key search terms from the message",
                    },
                  },
                  required: ["keywords"],
                },
              },
            ],
          },
        ],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
      });

      const result = await model.generateContent(
        `Extract shopping intent from: "${message}"\nBudget: ₹${spendingLimit}`
      );
      const calls = result.response.functionCalls();
      if (calls?.length) {
        return calls[0].args as { category?: string; keywords: string[] };
      }
    } catch (err) {
      console.warn("⚠️ Gemini intent parsing fallback active:", (err as any)?.message || err);
    }

    // High-precision deterministic intent fallback
    const lower = message.toLowerCase();
    let category = "General";
    if (lower.includes("shoe") || lower.includes("sneaker") || lower.includes("runner")) {
      category = "Running Shoes";
    } else if (lower.includes("sock")) {
      category = "Accessories";
    } else if (lower.includes("tee") || lower.includes("shirt")) {
      category = "Apparel";
    }

    const keywords = message
      .replace(/under|below|for|within|buy|need|want|₹|rs|inr|[0-9,]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    return { category, keywords: keywords.length > 0 ? keywords : [message] };
  }

  private async createMandate(opts: {
    spendingLimit: number;
    purpose: string;
    conversationId: string;
  }): Promise<Mandate> {
    const mandateId = `mnd_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // HMAC signature over mandate parameters
    const sigPayload = `${mandateId}:${opts.spendingLimit}:INR:${opts.purpose}:${expiresAt.toISOString()}`;
    const signature = createHmac("sha256", process.env.X402_SIGNING_SECRET!)
      .update(sigPayload)
      .digest("hex");

    const { rows } = await db.query(
      `INSERT INTO mandates (
        mandate_id, buyer_agent_id, spending_limit, currency,
        purpose, expires_at, status, signature
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        mandateId,
        this.buyerAgentId,
        opts.spendingLimit,
        "INR",
        opts.purpose,
        expiresAt,
        "ACTIVE",
        signature,
      ]
    );

    return {
      id: rows[0].id,
      mandateId: rows[0].mandate_id,
      buyerAgentId: rows[0].buyer_agent_id,
      spendingLimit: parseFloat(rows[0].spending_limit),
      spentAmount: 0,
      currency: rows[0].currency,
      purpose: rows[0].purpose,
      expiresAt: rows[0].expires_at,
      status: "ACTIVE",
      signature: rows[0].signature,
      createdAt: rows[0].created_at,
    };
  }
}
