import { randomBytes } from "crypto";
import type { X402PaymentRequirements } from "@zapai/types";
import { encodePaymentRequired } from "./headers";

/**
 * Generate standard x402 V2 Payment Requirements for a seller store
 */
export function createPaymentRequiredChallenge(params: {
  merchantId: string;
  orderId: string;
  amountPaise: number;
  ttlSeconds?: number;
}): {
  requirements: X402PaymentRequirements;
  encodedHeader: string;
  nonce: string;
} {
  const ttl = params.ttlSeconds ?? 120;
  const nonce = `x402_n_${randomBytes(12).toString("hex")}`;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const requirements: X402PaymentRequirements = {
    scheme: "exact",
    network: "zapai-inr",
    amount: String(params.amountPaise),
    asset: "INR",
    payTo: `merchant_${params.merchantId}`,
    resource: `order/${params.orderId}`,
    expiresAt,
    nonce,
  };

  const encodedHeader = encodePaymentRequired(requirements);

  return {
    requirements,
    encodedHeader,
    nonce,
  };
}
