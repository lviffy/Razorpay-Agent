import { randomBytes } from "crypto";
import type {
  A2AOffer,
  A2ACounterOffer,
  A2AAccept,
  A2AReject,
} from "@zapai/types";
import { getProductBySku, getNegotiationRules } from "../services/merchant";
import { evaluateBuyerOffer, createCounterOfferEvent } from "./offers";
import { reserveInventory } from "./inventory";

export interface NegotiationResult {
  status: "OFFER" | "COUNTER_OFFER" | "ACCEPTED" | "REJECTED";
  offer?: A2AOffer;
  counterOffer?: A2ACounterOffer;
  accept?: A2AAccept;
  reject?: A2AReject;
  reservation?: {
    reservationId: string;
    lockKey: string;
    expiresAt: string;
  };
  reasoning: string;
}

/**
 * Execute an A2A negotiation turn.
 * Evaluates buyer's offer, runs merchant rules, and either accepts, counters, or rejects.
 */
export async function executeA2ANegotiationTurn(params: {
  conversationId: string;
  buyerAgentId: string;
  merchantId: string;
  skuId: string;
  quantity?: number;
  targetPricePaise: number;
}): Promise<NegotiationResult> {
  const quantity = params.quantity ?? 1;
  const product = await getProductBySku(params.merchantId, params.skuId);

  if (!product) {
    const rejectEvent: A2AReject = {
      type: "REJECT",
      offerId: `off_${randomBytes(8).toString("hex")}`,
      merchantId: params.merchantId,
      reason: `Product with SKU ${params.skuId} not found in merchant catalog.`,
      timestamp: new Date().toISOString(),
    };
    return {
      status: "REJECTED",
      reject: rejectEvent,
      reasoning: rejectEvent.reason,
    };
  }

  // Build the initial structured offer event
  const offerEvent: A2AOffer = {
    type: "OFFER",
    offerId: `off_${randomBytes(8).toString("hex")}`,
    conversationId: params.conversationId,
    buyerAgentId: params.buyerAgentId,
    merchantId: params.merchantId,
    skuId: params.skuId,
    quantity,
    targetPrice: params.targetPricePaise,
    currency: "INR",
    expiresAt: new Date(Date.now() + 120 * 1000).toISOString(),
  };

  const rules = await getNegotiationRules(params.merchantId);
  const evaluation = evaluateBuyerOffer({
    product,
    rules: rules ?? {},
    offer: offerEvent,
  });

  if (evaluation.decision === "ACCEPT") {
    // Deal accepted! Reserve inventory atomically
    const reservation = await reserveInventory({
      storeId: params.merchantId,
      skuOrVariantId: product.id,
      quantity,
    });

    const acceptEvent: A2AAccept = {
      type: "ACCEPT",
      offerId: offerEvent.offerId,
      merchantId: params.merchantId,
      skuId: params.skuId,
      agreedPrice: evaluation.counterPrice ?? params.targetPricePaise,
      quantity,
      currency: "INR",
      timestamp: new Date().toISOString(),
    };

    return {
      status: "ACCEPTED",
      offer: offerEvent,
      accept: acceptEvent,
      reservation: reservation.success
        ? {
            reservationId: reservation.reservationId!,
            lockKey: reservation.lockKey!,
            expiresAt: reservation.expiresAt!,
          }
        : undefined,
      reasoning: evaluation.reasoning,
    };
  }

  if (evaluation.decision === "COUNTER") {
    const counterEvent = createCounterOfferEvent({
      offer: offerEvent,
      evaluation,
    });

    return {
      status: "COUNTER_OFFER",
      offer: offerEvent,
      counterOffer: counterEvent,
      reasoning: evaluation.reasoning,
    };
  }

  const rejectEvent: A2AReject = {
    type: "REJECT",
    offerId: offerEvent.offerId,
    merchantId: params.merchantId,
    reason: evaluation.reasoning,
    timestamp: new Date().toISOString(),
  };

  return {
    status: "REJECTED",
    offer: offerEvent,
    reject: rejectEvent,
    reasoning: evaluation.reasoning,
  };
}
