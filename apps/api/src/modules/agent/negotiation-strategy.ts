/**
 * negotiation-strategy.ts
 *
 * Pure, deterministic multi-round bargaining engine.
 * No LLM calls — only pricing math and strategy signals.
 *
 * Philosophy: A real seller never jumps to the floor price immediately.
 * They anchor high, then drip concessions across rounds until they hit
 * their absolute minimum. This module enforces that discipline.
 */

// ─── Concession Curve ─────────────────────────────────────────────────────────
// What fraction of the maximum allowed discount is revealed per round (0-indexed).
// Round 0 = buyer is asking for first discount (seller was at listed price)
// Round 1 = second push → give 40% of max discount
// Round 2 = third push  → give 70% of max discount
// Round 3+ = floor      → give 100% of max discount (final position)
const CONCESSION_CURVE: readonly number[] = [0, 0.4, 0.7, 1.0];

export type StrategyLabel = "ANCHOR" | "DRIP" | "FLOOR" | "ACCEPT" | "HOLD";

export interface SellerCounterResult {
  /** The price the seller should quote this round (in ₹). */
  counterPrice: number;
  /** Updated round index to persist in conversation state. */
  newRound: number;
  /** Strategy phase label for driving the response persona. */
  strategyLabel: StrategyLabel;
  /** Human-readable reasoning for logging / LLM prompt context. */
  reasoning: string;
  /** True when the buyer's own offer is already >= the seller's current counter — just accept. */
  shouldAccept: boolean;
}

// ─── Buyer Pressure Signals ───────────────────────────────────────────────────
// When a buyer uses urgency / ultimatum language, skip one concession step to
// signal flexibility but don't capitulate entirely.
const PRESSURE_PATTERNS: RegExp[] = [
  /final offer/i,
  /last (chance|offer|price)/i,
  /take it or leave/i,
  /won['']?t pay (more|higher)/i,
  /that['']?s (my|the) max/i,
  /can['']?t go (higher|above|more)/i,
  /best (i can|you can) do/i,
  /losing interest/i,
  /going elsewhere/i,
  /forget it/i,
];

function detectBuyerPressure(message: string): boolean {
  return PRESSURE_PATTERNS.some((re) => re.test(message));
}

// ─── Core Engine ─────────────────────────────────────────────────────────────

export interface ComputeCounterParams {
  /** MRP / sticker price in ₹. */
  listedPrice: number;
  /** Merchant's absolute hard minimum in ₹. */
  floorPrice: number;
  /** Max discount the merchant allows (e.g. 10 = 10%). */
  maxDiscountPct: number;
  /**
   * How many negotiation turns have already happened on this product.
   * 0 = the buyer is asking for the first discount right now.
   * Load from conversationState.negotiationRound.
   */
  currentRound: number;
  /**
   * The last price the seller quoted (if any).
   * Used for the concession-lock guarantee — price never goes UP.
   */
  lastSellerPrice?: number;
  /**
   * The price the buyer just explicitly named (if any).
   * If the buyer named a price that is at or above our current offer, accept.
   */
  buyerOfferedPrice?: number;
  /** Raw buyer message text — used for pressure-signal detection. */
  buyerMessage: string;
}

export function computeSellerCounterOffer(params: ComputeCounterParams): SellerCounterResult {
  const {
    listedPrice,
    floorPrice,
    maxDiscountPct,
    currentRound,
    lastSellerPrice,
    buyerOfferedPrice,
    buyerMessage,
  } = params;

  // Effective floor: whichever is higher between the absolute floor and the
  // max-discount cap. The DB floor is always the sovereign minimum.
  const maxDiscountRupees = Math.round((listedPrice * maxDiscountPct) / 100);
  const discountCapFloor = listedPrice - maxDiscountRupees;
  const effectiveFloor = Math.max(floorPrice, discountCapFloor);

  // If the buyer's explicit offer already meets our current (or last) offer,
  // accept immediately without further haggling.
  const referencePrice = lastSellerPrice ?? listedPrice;
  if (buyerOfferedPrice !== undefined && buyerOfferedPrice >= referencePrice) {
    return {
      counterPrice: Math.round(buyerOfferedPrice),
      newRound: currentRound,
      strategyLabel: "ACCEPT",
      reasoning: `Buyer's offer of ₹${buyerOfferedPrice} meets or exceeds our current quote of ₹${referencePrice}. Accepting.`,
      shouldAccept: true,
    };
  }

  // Detect urgency language — accelerate by one step if buyer is pressuring.
  const hasPressure = detectBuyerPressure(buyerMessage);
  const adjustedRound = hasPressure
    ? Math.min(currentRound + 1, CONCESSION_CURVE.length - 1)
    : currentRound;

  // Compute concession fraction for this round.
  const curveFraction = CONCESSION_CURVE[Math.min(adjustedRound, CONCESSION_CURVE.length - 1)];
  const rawOffer = Math.round(listedPrice - maxDiscountRupees * curveFraction);

  // Clamp to [effectiveFloor, listedPrice].
  const clampedOffer = Math.max(effectiveFloor, Math.min(listedPrice, rawOffer));

  // Concession lock: price should NEVER go up from what we have already said.
  const counterPrice =
    lastSellerPrice !== undefined
      ? Math.min(lastSellerPrice, clampedOffer)
      : clampedOffer;

  // If the buyer's offer is above our computed counter, accept theirs.
  if (buyerOfferedPrice !== undefined && buyerOfferedPrice >= counterPrice) {
    const acceptedAt = Math.min(buyerOfferedPrice, referencePrice);
    return {
      counterPrice: Math.round(acceptedAt),
      newRound: adjustedRound + 1,
      strategyLabel: "ACCEPT",
      reasoning: `Buyer's offer ₹${buyerOfferedPrice} is within our quote range. Closing at ₹${acceptedAt}.`,
      shouldAccept: true,
    };
  }

  // Choose strategy label based on round.
  let strategyLabel: StrategyLabel;
  let reasoning: string;
  const savedVsListed = listedPrice - counterPrice;
  const discountPct =
    listedPrice > 0 ? Math.round((savedVsListed / listedPrice) * 100) : 0;

  if (curveFraction === 0) {
    strategyLabel = "ANCHOR";
    reasoning = `Anchoring at listed price ₹${counterPrice}. No discount offered yet (round ${adjustedRound}).`;
  } else if (curveFraction < 1.0) {
    strategyLabel = "DRIP";
    reasoning = `Drip concession round ${adjustedRound}: offering ${discountPct}% off → ₹${counterPrice} (saving ₹${savedVsListed} vs listed ₹${listedPrice}).`;
  } else {
    strategyLabel = "FLOOR";
    reasoning = `Floor price reached (round ${adjustedRound}): ₹${counterPrice} is our absolute minimum. Cannot go lower.`;
  }

  if (hasPressure) {
    reasoning = `[Pressure detected] ${reasoning}`;
  }

  return {
    counterPrice,
    newRound: adjustedRound + 1,
    strategyLabel,
    reasoning,
    shouldAccept: false,
  };
}

// ─── Utility: generate persona-appropriate preamble for the LLM ───────────────

export function getStrategyPersonaHint(label: StrategyLabel): string {
  switch (label) {
    case "ANCHOR":
      return "Highlight the product's value, quality, and what's included (free shipping, warranty, stock availability). Do NOT concede on price yet. Be warm but confident.";
    case "DRIP":
      return "Offer a small, specific discount. Frame it as a special gesture ('let me see what I can do for you'). Sound genuinely helpful, not desperate.";
    case "FLOOR":
      return "Make clear this is the absolute final price — cannot go lower. Add a non-price sweetener if possible (free shipping, bundle item). Sound firm but friendly.";
    case "ACCEPT":
      return "Enthusiastically confirm the deal. Generate the payment link. Sound delighted to close.";
    case "HOLD":
      return "The buyer's price is below our floor. Politely but firmly decline and restate our floor price. Offer alternatives if any exist.";
  }
}
