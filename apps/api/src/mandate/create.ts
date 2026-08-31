import { createHmac, randomBytes } from "crypto";
import type { SpendingMandate } from "@zapai/types";

const MANDATE_SECRET = process.env.MANDATE_SIGNING_SECRET || "zapai_default_mandate_secret_key_2026";

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(): string {
  return `nonce_${randomBytes(16).toString("hex")}`;
}

/**
 * Compute the canonical string representation of a mandate for signing
 */
export function getCanonicalMandatePayload(params: {
  mandateId: string;
  buyerId: string;
  spendingLimit: number;
  currency: "INR";
  purpose: { category?: string; skuIds?: string[]; description?: string };
  merchantAllowlist?: string[];
  expiresAt: string;
  nonce: string;
}): string {
  return JSON.stringify({
    mandateId: params.mandateId,
    buyerId: params.buyerId,
    spendingLimit: params.spendingLimit,
    currency: params.currency,
    purpose: {
      category: params.purpose.category ?? null,
      skuIds: params.purpose.skuIds ? [...params.purpose.skuIds].sort() : null,
      description: params.purpose.description ?? null,
    },
    merchantAllowlist: params.merchantAllowlist ? [...params.merchantAllowlist].sort() : null,
    expiresAt: params.expiresAt,
    nonce: params.nonce,
  });
}

/**
 * Sign a canonical mandate string using HMAC-SHA256
 */
export function signMandate(canonicalPayload: string, secret: string = MANDATE_SECRET): string {
  return createHmac("sha256", secret).update(canonicalPayload).digest("hex");
}

/**
 * Factory to create and sign a new SpendingMandate
 */
export function createSpendingMandate(params: {
  buyerId: string;
  spendingLimit: number; // in paise
  currency?: "INR";
  purpose?: { category?: string; skuIds?: string[]; description?: string };
  merchantAllowlist?: string[];
  ttlSeconds?: number;
  secret?: string;
}): SpendingMandate {
  const mandateId = `mnd_${randomBytes(8).toString("hex")}`;
  const nonce = generateNonce();
  const ttl = params.ttlSeconds ?? 3600; // default 1 hour
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const currency = params.currency ?? "INR";
  const purpose = params.purpose ?? {};
  const secret = params.secret ?? MANDATE_SECRET;

  const canonicalPayload = getCanonicalMandatePayload({
    mandateId,
    buyerId: params.buyerId,
    spendingLimit: params.spendingLimit,
    currency,
    purpose,
    merchantAllowlist: params.merchantAllowlist,
    expiresAt,
    nonce,
  });

  const signature = signMandate(canonicalPayload, secret);

  return {
    mandateId,
    buyerId: params.buyerId,
    spendingLimit: params.spendingLimit,
    spentAmount: 0,
    currency,
    purpose,
    merchantAllowlist: params.merchantAllowlist,
    expiresAt,
    nonce,
    signature,
    createdAt: new Date().toISOString(),
  };
}
