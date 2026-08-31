import { createHmac, randomBytes } from "crypto";
import type {
  SpendingMandate,
  X402PaymentRequirements,
  X402PaymentAuthorization,
} from "@zapai/types";
import { decodePaymentRequired, encodePaymentSignature } from "./headers";
import { verifyMandatePolicy } from "../mandate/policy";

const MANDATE_SECRET = process.env.MANDATE_SIGNING_SECRET || "zapai_default_mandate_secret_key_2026";

export interface BuyerPaymentSignResult {
  success: boolean;
  authorization?: X402PaymentAuthorization;
  encodedHeader?: string;
  error?: string;
}

/**
 * Buyer Agent evaluates x402 challenge against spending mandate and produces a signed PAYMENT-SIGNATURE
 */
export function signPaymentChallenge(params: {
  paymentRequiredHeader: string;
  mandate: SpendingMandate;
  merchantId: string;
  skuId?: string;
  secret?: string;
}): BuyerPaymentSignResult {
  try {
    const requirements: X402PaymentRequirements = decodePaymentRequired(params.paymentRequiredHeader);
    const amountPaise = parseInt(requirements.amount, 10);

    // 1. Evaluate mandate policy
    const policyResult = verifyMandatePolicy({
      mandate: params.mandate,
      merchantId: params.merchantId,
      skuId: params.skuId,
      amount: amountPaise,
      currency: "INR",
    });

    if (!policyResult.valid) {
      return {
        success: false,
        error: `Mandate policy validation failed: ${policyResult.error}`,
      };
    }

    // 2. Verify challenge expiration
    if (new Date(requirements.expiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: "Payment challenge has already expired",
      };
    }

    const paymentId = `zap_pay_${randomBytes(8).toString("hex")}`;
    const timestamp = new Date().toISOString();
    const secret = params.secret ?? MANDATE_SECRET;

    // 3. Compute signature over authorization fields
    const authPayloadToSign = JSON.stringify({
      paymentId,
      mandateId: params.mandate.mandateId,
      resource: requirements.resource,
      amount: requirements.amount,
      currency: "INR",
      nonce: requirements.nonce,
      timestamp,
    });

    const signature = createHmac("sha256", secret).update(authPayloadToSign).digest("hex");

    const authorization: X402PaymentAuthorization = {
      paymentId,
      mandateId: params.mandate.mandateId,
      resource: requirements.resource,
      amount: requirements.amount,
      currency: "INR",
      nonce: requirements.nonce,
      timestamp,
      signature,
    };

    const encodedHeader = encodePaymentSignature(authorization);

    return {
      success: true,
      authorization,
      encodedHeader,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error signing payment challenge: ${err.message}`,
    };
  }
}
