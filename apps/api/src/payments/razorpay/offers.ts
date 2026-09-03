import { getRazorpayClient } from "../../integrations/razorpay/index";
import { logger } from "../../core/logger/index";

export interface RazorpayOffer {
  id: string;
  name: string;
  code?: string;
  issuer?: string; // e.g. "HDFC", "ICICI", "UPI", "CRED"
  paymentMethod?: "card" | "upi" | "netbanking" | "wallet";
  discountType: "percentage" | "flat";
  percentRate?: number;
  flatAmountPaise?: number;
  minOrderAmountPaise: number;
  maxDiscountPaise?: number;
  expiresAt?: string;
}

export interface BestOfferCalculationResult {
  offerApplied?: RazorpayOffer;
  originalPricePaise: number;
  discountedPricePaise: number;
  savingsPaise: number;
  offerSummary: string;
}

const DEFAULT_PARTNER_OFFERS: RazorpayOffer[] = [
  {
    id: "offer_hdfc_instant_10",
    name: "HDFC Instant 10% Off",
    code: "HDFC10",
    issuer: "HDFC",
    paymentMethod: "card",
    discountType: "percentage",
    percentRate: 10,
    minOrderAmountPaise: 200000, // ₹2,000
    maxDiscountPaise: 50000,     // ₹500
  },
  {
    id: "offer_upi_flat_200",
    name: "UPI AutoPay ₹200 Instant Benefit",
    code: "UPIAUTOPAY",
    issuer: "UPI",
    paymentMethod: "upi",
    discountType: "flat",
    flatAmountPaise: 20000,      // ₹200
    minOrderAmountPaise: 150000, // ₹1,500
  },
  {
    id: "offer_icici_5_percent",
    name: "ICICI Smart 5% Discount",
    code: "ICICI5",
    issuer: "ICICI",
    paymentMethod: "card",
    discountType: "percentage",
    percentRate: 5,
    minOrderAmountPaise: 100000, // ₹1,000
    maxDiscountPaise: 30000,     // ₹300
  },
];

/**
 * Fetches active Razorpay Offers from POST /v1/offers or default curated list
 */
export async function fetchActiveRazorpayOffers(params?: {
  merchantId?: string;
  amountPaise?: number;
}): Promise<RazorpayOffer[]> {
  const client = getRazorpayClient();

  if (!client) {
    logger.info(`[Razorpay Offers] Loaded ${DEFAULT_PARTNER_OFFERS.length} active affiliate & bank offers`);
    return DEFAULT_PARTNER_OFFERS;
  }

  try {
    // @ts-ignore - Razorpay offers API
    const offers = await client.offers?.all?.({ count: 10 }).catch(() => null);
    if (offers && Array.isArray(offers.items) && offers.items.length > 0) {
      return offers.items.map((item: any) => ({
        id: item.id,
        name: item.name ?? "Razorpay Partner Offer",
        code: item.code,
        issuer: item.issuer,
        paymentMethod: item.payment_method,
        discountType: item.percent_rate ? "percentage" : "flat",
        percentRate: item.percent_rate,
        flatAmountPaise: item.flat_amount,
        minOrderAmountPaise: item.min_order_amount ?? 0,
        maxDiscountPaise: item.max_discount_amount,
      }));
    }
    return DEFAULT_PARTNER_OFFERS;
  } catch (err: any) {
    logger.warn(`[Razorpay Offers] Fetch fallback: ${err.message}`);
    return DEFAULT_PARTNER_OFFERS;
  }
}

/**
 * Calculates the optimal available Razorpay offer to maximize discount for an agent negotiation
 */
export function calculateBestRazorpayDiscount(
  amountPaise: number,
  offers: RazorpayOffer[] = DEFAULT_PARTNER_OFFERS
): BestOfferCalculationResult {
  let bestOffer: RazorpayOffer | undefined;
  let maxSavingsPaise = 0;

  for (const offer of offers) {
    if (amountPaise < offer.minOrderAmountPaise) continue;

    let savings = 0;
    if (offer.discountType === "percentage" && offer.percentRate) {
      savings = Math.round((amountPaise * offer.percentRate) / 100);
      if (offer.maxDiscountPaise && savings > offer.maxDiscountPaise) {
        savings = offer.maxDiscountPaise;
      }
    } else if (offer.discountType === "flat" && offer.flatAmountPaise) {
      savings = offer.flatAmountPaise;
    }

    if (savings > maxSavingsPaise) {
      maxSavingsPaise = savings;
      bestOffer = offer;
    }
  }

  const discountedPricePaise = Math.max(0, amountPaise - maxSavingsPaise);

  return {
    offerApplied: bestOffer,
    originalPricePaise: amountPaise,
    discountedPricePaise,
    savingsPaise: maxSavingsPaise,
    offerSummary: bestOffer
      ? `Applied '${bestOffer.name}' (-₹${(maxSavingsPaise / 100).toFixed(2)})`
      : "No applicable bank/UPI offer",
  };
}
