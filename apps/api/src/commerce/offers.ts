import type {
  Product,
  NegotiationRules,
  A2ACounterOffer,
  A2AOffer,
} from "@zapai/types";
import { randomBytes } from "crypto";
import {
  calculateBestRazorpayDiscount,
  type RazorpayOffer,
  type BestOfferCalculationResult,
} from "../payments/razorpay/offers";

export interface OfferEvaluationResult {
  decision: "ACCEPT" | "COUNTER" | "REJECT";
  counterPrice?: number; // in paise
  discount?: number;     // in paise
  shippingFree: boolean;
  bundleItems?: Array<{ skuId: string; title: string; price: number }>;
  razorpayOffer?: BestOfferCalculationResult;
  reasoning: string;
}

/**
 * Deterministically evaluate an incoming buyer offer against merchant rules and floor pricing.
 */
export function evaluateBuyerOffer(params: {
  product: Product;
  rules: NegotiationRules;
  offer: A2AOffer;
  availableRazorpayOffers?: RazorpayOffer[];
}): OfferEvaluationResult {
  const { product, rules, offer, availableRazorpayOffers } = params;
  const listedPricePaise = Math.round((product.listedPrice ?? product.price ?? 0) * 100);
  const floorPricePaise = Math.round((product.floorPrice ?? product.minPrice ?? 0) * 100);
  const targetPricePaise = offer.targetPrice;

  const maxDiscountPercent = rules.maxDiscountPercentage ?? rules.maxDiscountPercent ?? 10;
  const maxAllowedDiscountPaise = Math.round((listedPricePaise * maxDiscountPercent) / 100);
  // DB floorPrice is the sovereign hard minimum. The %-based cap is a secondary constraint:
  // the offered price must not go below EITHER the floor OR what the max-discount allows.
  // Since a merchant sets floorPrice explicitly, it wins over the %-based calculation.
  const lowestAllowedPricePaise = Math.max(floorPricePaise, listedPricePaise - maxAllowedDiscountPaise);

  const freeShippingThresholdPaise = Math.round((rules.freeShippingThreshold ?? rules.freeShippingAbove ?? 3000) * 100);

  // 1. If offer meets or exceeds listed price: accept immediately
  if (targetPricePaise >= listedPricePaise) {
    return {
      decision: "ACCEPT",
      counterPrice: targetPricePaise,
      discount: 0,
      shippingFree: targetPricePaise >= freeShippingThresholdPaise,
      reasoning: `Offered price ₹${(targetPricePaise / 100).toFixed(2)} meets or exceeds listed price ₹${(listedPricePaise / 100).toFixed(2)}.`,
    };
  }

  // 2. If offer is between lowestAllowedPrice and listedPrice: accept deal
  if (targetPricePaise >= lowestAllowedPricePaise) {
    const discountPaise = listedPricePaise - targetPricePaise;
    return {
      decision: "ACCEPT",
      counterPrice: targetPricePaise,
      discount: discountPaise,
      shippingFree: targetPricePaise >= freeShippingThresholdPaise,
      reasoning: `Offered price ₹${(targetPricePaise / 100).toFixed(2)} is within authorized discount bound (max ${maxDiscountPercent}%).`,
    };
  }

  // 3. If offer is below lowestAllowedPrice, formulate a counter-offer
  // Counter-offer at lowestAllowedPrice (or midpoint)
  const counterPricePaise = lowestAllowedPricePaise;
  const discountPaise = listedPricePaise - counterPricePaise;
  const isFreeShipping = counterPricePaise >= freeShippingThresholdPaise;

  const bundleItems = rules.allowBundleOffers || rules.bundleOffersEnabled
    ? [{ skuId: "SKU-SOCK-001", title: "Pro Performance Socks (Pair)", price: 0 }]
    : undefined;

  let rzpOfferCalc: BestOfferCalculationResult | undefined;
  if (availableRazorpayOffers && availableRazorpayOffers.length > 0) {
    rzpOfferCalc = calculateBestRazorpayDiscount(counterPricePaise, availableRazorpayOffers);
  }

  const offerNote = rzpOfferCalc?.offerApplied
    ? ` + Eligible for ${rzpOfferCalc.offerSummary} at checkout`
    : "";

  return {
    decision: "COUNTER",
    counterPrice: counterPricePaise,
    discount: discountPaise,
    shippingFree: isFreeShipping,
    bundleItems,
    razorpayOffer: rzpOfferCalc,
    reasoning: `Offered price ₹${(targetPricePaise / 100).toFixed(2)} is below floor price. Countering with ₹${(counterPricePaise / 100).toFixed(2)} (${maxDiscountPercent}% max discount) + ${isFreeShipping ? "free shipping" : "standard shipping"}${bundleItems ? " + complimentary socks" : ""}${offerNote}.`,
  };
}

/**
 * Generate a structured A2ACounterOffer event
 */
export function createCounterOfferEvent(params: {
  offer: A2AOffer;
  evaluation: OfferEvaluationResult;
  ttlSeconds?: number;
}): A2ACounterOffer {
  const ttl = params.ttlSeconds ?? 120;
  return {
    type: "COUNTER_OFFER",
    offerId: params.offer.offerId,
    counterOfferId: `cnt_${randomBytes(8).toString("hex")}`,
    merchantId: params.offer.merchantId,
    price: params.evaluation.counterPrice!,
    discount: params.evaluation.discount ?? 0,
    currency: "INR",
    shippingFree: params.evaluation.shippingFree,
    bundleItems: params.evaluation.bundleItems,
    reasoning: params.evaluation.reasoning,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
  };
}
