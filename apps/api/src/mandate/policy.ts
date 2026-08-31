import type {
  SpendingMandateVerificationParams,
  SpendingMandateVerificationResult,
} from "@zapai/types";
import { verifyMandateSignature, isNonceConsumed, consumeNonce } from "./verify";

/**
 * Deterministic Server-Side Zero-Trust Policy Evaluator.
 * The LLM never enforces financial boundaries; this server function does.
 */
export function verifyMandatePolicy(
  params: SpendingMandateVerificationParams,
  options: { consumeNonce?: boolean; secret?: string } = { consumeNonce: false }
): SpendingMandateVerificationResult {
  const { mandate, merchantId, skuId, category, amount, currency } = params;

  // 1. Verify cryptographic signature
  if (!verifyMandateSignature(mandate, options.secret)) {
    return {
      valid: false,
      error: "Cryptographic mandate signature verification failed",
      code: "INVALID_SIGNATURE",
    };
  }

  // 2. Verify expiration
  const now = Date.now();
  const expiryTime = new Date(mandate.expiresAt).getTime();
  if (isNaN(expiryTime) || now > expiryTime) {
    return {
      valid: false,
      error: `Mandate expired at ${mandate.expiresAt}`,
      code: "EXPIRED",
    };
  }

  // 3. Verify Nonce (Replay attack defense)
  if (isNonceConsumed(mandate.nonce)) {
    return {
      valid: false,
      error: `Mandate nonce ${mandate.nonce} was already consumed`,
      code: "NONCE_REUSED",
    };
  }

  // 4. Currency Check
  if (currency !== "INR" || mandate.currency !== "INR") {
    return {
      valid: false,
      error: `Expected INR currency, received ${currency}`,
      code: "CURRENCY_MISMATCH",
    };
  }

  // 5. Amount <= Spending Limit
  const remainingBudget = mandate.spendingLimit - (mandate.spentAmount ?? 0);
  if (amount > remainingBudget) {
    return {
      valid: false,
      error: `Requested amount ₹${(amount / 100).toFixed(2)} exceeds remaining budget ₹${(remainingBudget / 100).toFixed(2)}`,
      code: "EXCEEDS_SPENDING_LIMIT",
    };
  }

  // 6. Merchant Allowlist Check
  if (
    mandate.merchantAllowlist &&
    mandate.merchantAllowlist.length > 0 &&
    !mandate.merchantAllowlist.includes(merchantId)
  ) {
    return {
      valid: false,
      error: `Merchant ${merchantId} is not in the authorized merchant allowlist`,
      code: "MERCHANT_NOT_ALLOWED",
    };
  }

  // 7. Purpose SKU & Category Check
  if (
    skuId &&
    mandate.purpose.skuIds &&
    mandate.purpose.skuIds.length > 0 &&
    !mandate.purpose.skuIds.includes(skuId)
  ) {
    return {
      valid: false,
      error: `SKU ${skuId} is not authorized in mandate purpose`,
      code: "SKU_NOT_ALLOWED",
    };
  }

  if (
    category &&
    mandate.purpose.category &&
    mandate.purpose.category.toLowerCase() !== category.toLowerCase()
  ) {
    return {
      valid: false,
      error: `Category ${category} does not match authorized purpose category ${mandate.purpose.category}`,
      code: "CATEGORY_NOT_ALLOWED",
    };
  }

  // If consumeNonce is true, commit the nonce usage
  if (options.consumeNonce) {
    consumeNonce(mandate.nonce);
  }

  return { valid: true };
}
