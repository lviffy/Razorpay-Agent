import { timingSafeEqual } from "crypto";
import type { SpendingMandate } from "@zapai/types";
import { getCanonicalMandatePayload, signMandate } from "./create";

const MANDATE_SECRET = process.env.MANDATE_SIGNING_SECRET || "zapai_default_mandate_secret_key_2026";

// In-memory nonce set with TTL cleanup for single-use protection
const usedNonces = new Set<string>();

/**
 * Mark a nonce as consumed. Returns false if nonce was already used.
 */
export function consumeNonce(nonce: string): boolean {
  if (usedNonces.has(nonce)) {
    return false;
  }
  usedNonces.add(nonce);
  return true;
}

/**
 * Check if nonce was previously consumed
 */
export function isNonceConsumed(nonce: string): boolean {
  return usedNonces.has(nonce);
}

/**
 * Verify cryptographic signature of a spending mandate
 */
export function verifyMandateSignature(mandate: SpendingMandate, secret: string = MANDATE_SECRET): boolean {
  try {
    const expectedCanonical = getCanonicalMandatePayload({
      mandateId: mandate.mandateId,
      buyerId: mandate.buyerId,
      spendingLimit: mandate.spendingLimit,
      currency: mandate.currency,
      purpose: mandate.purpose ?? {},
      merchantAllowlist: mandate.merchantAllowlist,
      expiresAt: mandate.expiresAt,
      nonce: mandate.nonce,
    });

    const expectedSignature = signMandate(expectedCanonical, secret);

    const sigBuf = Buffer.from(mandate.signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
