import { getGeminiClient, getGroqClient } from "../../integrations/llm/index.ts";
import { getAllStores } from "../../services/merchant.ts";
import { SellerAgent } from "./seller-agent.ts";
import { db } from "@zapai/database";
import type { Mandate, SellerOffer } from "@zapai/types";
import { v4 as uuidv4 } from "uuid";
import { createHmac } from "crypto";
import { logger } from "../../core/logger/index.ts";

export interface BuyerTask {
  message: string;
  spendingLimit: number;
  phoneNumber: string;
  conversationId: string;
  waMessageId: string;
}

export interface BuyerDecision {
  accepted: boolean;
  offer?: SellerOffer;
  mandate?: Mandate;
  reasoning: string;
  escalateToUser?: boolean;
  escalationMessage?: string;
}

export class BuyerAgent {
  private buyerAgentId: string;

  constructor() {
    this.buyerAgentId = `agent_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
  }

  async processTask(task: BuyerTask): Promise<BuyerDecision> {
    logger.debug({ phone: task.phoneNumber, message: task.message }, "[BuyerAgent] Processing task");

    const intent = await this.parseIntent(task.message, task.spendingLimit);
    const mandate = await this.createMandate({
      spendingLimit: task.spendingLimit,
      purpose: intent.category ?? "general purchase",
      conversationId: task.conversationId,
    });

    const stores = await getAllStores();
    const offerResults = await Promise.allSettled(
      stores.map(async (store) => {
        const seller = new SellerAgent(store.id);
        const offer = await seller.handleQuery({
          buyerQuery: task.message,
          targetPrice: task.spendingLimit,
          category: intent.category,
          sessionId: task.conversationId,
        });
        return { store, offer };
      })
    );

    const validOffers: Array<{ store: any; offer: SellerOffer }> = [];
    for (const result of offerResults) {
      if (result.status === "fulfilled" && result.value.offer) {
        validOffers.push(result.value as { store: any; offer: SellerOffer });
      }
    }

    if (validOffers.length === 0) {
      return {
        accepted: false,
        reasoning: "No stores returned matching products for this query.",
      };
    }

    const withinBudget = validOffers.filter(
      (o) => o.offer.offeredPrice <= task.spendingLimit
    );

    if (withinBudget.length === 0) {
      const cheapest = validOffers.sort(
        (a, b) => a.offer.offeredPrice - b.offer.offeredPrice
      )[0];

      return {
        accepted: false,
        offer: cheapest.offer,
        escalateToUser: true,
        reasoning: `All offers exceed your limit of ₹${task.spendingLimit.toLocaleString("en-IN")}.`,
        escalationMessage: `Best price found: *${cheapest.offer.product.title}* at *₹${cheapest.offer.offeredPrice.toLocaleString("en-IN")}* from ${cheapest.store.name} (exceeds limit by ₹${(cheapest.offer.offeredPrice - task.spendingLimit).toLocaleString("en-IN")}). Would you like to approve this amount?`,
      };
    }

    withinBudget.sort((a, b) => {
      const priceDiff = a.offer.offeredPrice - b.offer.offeredPrice;
      if (priceDiff !== 0) return priceDiff;
      if (a.offer.shippingFree && !b.offer.shippingFree) return -1;
      if (!a.offer.shippingFree && b.offer.shippingFree) return 1;
      return 0;
    });

    const winning = withinBudget[0];

    return {
      accepted: true,
      offer: winning.offer,
      mandate,
      reasoning: `Selected ${winning.offer.product.title} from ${winning.store.name} at ₹${winning.offer.offeredPrice} (within limit of ₹${task.spendingLimit}). Free shipping: ${winning.offer.shippingFree}.`,
    };
  }

  private async parseIntent(
    message: string,
    fallbackLimit: number
  ): Promise<{ category?: string; targetPrice?: number }> {
    const groq = getGroqClient();
    if (groq) {
      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are an intent parser for an e-commerce buyer agent. Extract category and max budget. Output strictly JSON: {"category": string, "targetPrice": number}. If budget not stated, use null.`,
            },
            { role: "user", content: `Customer message: "${message}"` },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
        return {
          category: parsed.category || undefined,
          targetPrice: parsed.targetPrice || fallbackLimit,
        };
      } catch (err) {
        logger.warn({ err }, "Groq intent parsing failed, using fallback");
      }
    }

    const priceMatch = message.match(/(?:under|below|max|upto|budget)\s*₹?\s*(\d+)/i);
    const targetPrice = priceMatch ? parseInt(priceMatch[1], 10) : fallbackLimit;

    let category = "general";
    if (/shoe|pegasus|running|sneaker/i.test(message)) category = "Running Shoes";
    else if (/sock/i.test(message)) category = "Accessories";
    else if (/watch|garmin|gps/i.test(message)) category = "Wearables";

    return { category, targetPrice };
  }

  private async createMandate(opts: {
    spendingLimit: number;
    purpose: string;
    conversationId: string;
  }): Promise<Mandate> {
    const mandateId = `mnd_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const secret = process.env.X402_SIGNING_SECRET || "default_mandate_secret";
    const signaturePayload = `${mandateId}:${this.buyerAgentId}:${opts.spendingLimit}:${expiresAt.toISOString()}`;
    const signature = createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");

    const { rows } = await db.query(
      `INSERT INTO mandates (
        mandate_id, buyer_agent_id, spending_limit, spent_amount,
        currency, purpose, expires_at, status, signature
      ) VALUES ($1, $2, $3, 0, 'INR', $4, $5, 'ACTIVE', $6)
      RETURNING *`,
      [mandateId, this.buyerAgentId, opts.spendingLimit, opts.purpose, expiresAt, signature]
    );

    const row = rows[0];
    return {
      id: row.id,
      mandateId: row.mandate_id,
      buyerAgentId: row.buyer_agent_id,
      spendingLimit: parseFloat(row.spending_limit),
      spentAmount: parseFloat(row.spent_amount),
      currency: row.currency,
      purpose: row.purpose,
      expiresAt: row.expires_at,
      status: row.status,
      signature: row.signature,
      createdAt: row.created_at,
    };
  }
}
