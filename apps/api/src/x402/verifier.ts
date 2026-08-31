import { createHmac, timingSafeEqual } from "crypto";
import type {
  SpendingMandate,
  X402PaymentRequirements,
  X402PaymentAuthorization,
} from "@zapai/types";
import { verifyMandatePolicy } from "../mandate/policy";

const MANDATE_SECRET = process.env.MANDATE_SIGNING_SECRET || "zapai_default_mandate_secret_key_2026";

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Server-side verifier for x402 payment authorizations
 */
export function verifyPaymentAuthorization(params: {
  authorization: X402PaymentAuthorization;
  requirements: X402PaymentRequirements;
  mandate: SpendingMandate;
  merchantId: string;
  skuId?: string;
  secret?: string;
  consumeNonce?: boolean;
}): VerificationResult {
  const { authorization, requirements, mandate, merchantId, skuId } = params;
  const secret = params.secret ?? MANDATE_SECRET;

  // 1. Verify nonce alignment
  if (authorization.nonce !== requirements.nonce) {
    return {
      valid: false,
      error: `Nonce mismatch: expected ${requirements.nonce}, received ${authorization.nonce}`,
    };
  }

  // 2. Verify amount alignment
  if (authorization.amount !== requirements.amount) {
    return {
      valid: false,
      error: `Amount mismatch: expected ${requirements.amount}, received ${authorization.amount}`,
    };
  }

  // 3. Verify resource alignment
  if (authorization.resource !== requirements.resource) {
    return {
      valid: false,
      error: `Resource mismatch: expected ${requirements.resource}, received ${authorization.resource}`,
    };
  }

  // 4. Verify cryptographic signature of authorization
  const authPayloadToSign = JSON.stringify({
    paymentId: authorization.paymentId,
    mandateId: authorization.mandateId,
    resource: authorization.resource,
    amount: authorization.amount,
    currency: authorization.currency,
    nonce: authorization.nonce,
    timestamp: authorization.timestamp,
  });

  const expectedSignature = createHmac("sha256", secret).update(authPayloadToSign).digest("hex");
  const sigBuf = Buffer.from(authorization.signature, "hex");
  const expBuf = Buffer.from(expectedSignature, "hex");

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return {
      valid: false,
      error: "Cryptographic signature on payment authorization is invalid",
    };
  }

  // 5. Run zero-trust mandate policy check
  const policyCheck = verifyMandatePolicy(
    {
      mandate,
      merchantId,
      skuId,
      amount: parseInt(authorization.amount, 10),
      currency: "INR",
    },
    { consumeNonce: params.consumeNonce ?? true, secret }
  );

  if (!policyCheck.valid) {
    return {
      valid: false,
      error: policyCheck.error,
    };
  }

  return { valid: true };
}
