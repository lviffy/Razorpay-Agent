import type {
  X402PaymentRequirements,
  X402PaymentAuthorization,
  X402PaymentResponse,
} from "@zapai/types";

/**
 * Standard x402 V2 Header Names
 */
export const X402_HEADERS = {
  PAYMENT_REQUIRED: "PAYMENT-REQUIRED",
  PAYMENT_SIGNATURE: "PAYMENT-SIGNATURE",
  PAYMENT_RESPONSE: "PAYMENT-RESPONSE",
} as const;

/**
 * Encode object to base64 JSON string
 */
export function encodeHeaderPayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decode base64 JSON string into typed object
 */
export function decodeHeaderPayload<T>(base64String: string): T {
  const json = Buffer.from(base64String, "base64").toString("utf-8");
  return JSON.parse(json) as T;
}

/**
 * Helper to encode PAYMENT-REQUIRED challenge
 */
export function encodePaymentRequired(requirements: X402PaymentRequirements): string {
  return encodeHeaderPayload(requirements);
}

/**
 * Helper to decode PAYMENT-REQUIRED challenge
 */
export function decodePaymentRequired(headerValue: string): X402PaymentRequirements {
  return decodeHeaderPayload<X402PaymentRequirements>(headerValue);
}

/**
 * Helper to encode PAYMENT-SIGNATURE authorization
 */
export function encodePaymentSignature(authorization: X402PaymentAuthorization): string {
  return encodeHeaderPayload(authorization);
}

/**
 * Helper to decode PAYMENT-SIGNATURE authorization
 */
export function decodePaymentSignature(headerValue: string): X402PaymentAuthorization {
  return decodeHeaderPayload<X402PaymentAuthorization>(headerValue);
}

/**
 * Helper to encode PAYMENT-RESPONSE
 */
export function encodePaymentResponse(response: X402PaymentResponse): string {
  return encodeHeaderPayload(response);
}

/**
 * Helper to decode PAYMENT-RESPONSE
 */
export function decodePaymentResponse(headerValue: string): X402PaymentResponse {
  return decodeHeaderPayload<X402PaymentResponse>(headerValue);
}
