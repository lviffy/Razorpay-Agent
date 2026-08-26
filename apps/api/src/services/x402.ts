import { createHmac, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import type { X402Challenge, X402Headers } from "@zapai/types";
import { env } from "../config/env.ts";

const SIGNING_SECRET = env.X402_SIGNING_SECRET || "zapai_x402_signing_secret_key_2026";
const CHALLENGE_TTL_SECONDS = 120;

export function issueChallenge(
  orderId: string,
  amountInPaise: number
): { headers: X402Headers; challenge: X402Challenge } {
  const nonce = randomBytes(16).toString("hex");
  const expiry = Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS;

  const payload = `${orderId}:${amountInPaise}:${expiry}:${nonce}`;
  const challenge = createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  const challengeObj: X402Challenge = {
    version: "1.0",
    scheme: "razorpay-inr",
    orderId,
    amount: amountInPaise,
    expiry,
    challenge,
  };

  const headers: X402Headers = {
    "X-402-Version": "1.0",
    "X-402-Scheme": "razorpay-inr",
    "X-402-Order-ID": orderId,
    "X-402-Amount": String(amountInPaise),
    "X-402-Expiry": String(expiry),
    "X-402-Challenge": challenge,
  };

  return { headers, challenge: challengeObj };
}

export function verifyAuthorization(
  headers: Record<string, string | string[] | undefined>
): { valid: boolean; reason?: string } {
  const authToken = headers["x-402-authorization"] as string | undefined;
  const orderId = headers["x-402-order-id"] as string | undefined;
  const amount = headers["x-402-amount"] as string | undefined;
  const expiry = headers["x-402-expiry"] as string | undefined;

  if (!authToken || !orderId || !amount || !expiry) {
    return { valid: false, reason: "Missing required X-402-* headers" };
  }

  const expiryTs = parseInt(expiry, 10);
  if (Date.now() / 1000 > expiryTs) {
    return { valid: false, reason: "x402 challenge expired" };
  }

  const expectedPayload = `${orderId}:${amount}:${expiry}`;
  const expectedHmac = createHmac("sha256", SIGNING_SECRET)
    .update(expectedPayload)
    .digest("hex");

  const expected = Buffer.from(expectedHmac, "hex");
  const received = Buffer.from(authToken, "hex");

  if (expected.length !== received.length) {
    return { valid: false, reason: "Invalid authorization token" };
  }

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected[i] ^ received[i];
  }

  return diff === 0
    ? { valid: true }
    : { valid: false, reason: "Authorization token mismatch" };
}

export function issueTransactionId(): string {
  return `x402_${uuidv4().replace(/-/g, "")}`;
}

export function issueReceipt(razorpayPaymentId: string): string {
  return razorpayPaymentId;
}
