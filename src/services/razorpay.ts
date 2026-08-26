import Razorpay from "razorpay";
import { createHmac } from "crypto";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay Service — Standard Payment Links only (UPI links not in test mode)
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Orders ────────────────────────────────────────────────────────────────────

interface CreateOrderOptions {
  amountInPaise: number;
  currency?: string;
  receipt: string;       // x402_transaction_id
  sessionId: string;     // for idempotency key
  // Per-order routing metadata passed through to webhook
  notes?: {
    conversation_id?: string;
    phone_number?: string;
    product_id?: string;
    [key: string]: string | undefined;
  };
}

export async function createOrder(opts: CreateOrderOptions) {
  const order = await razorpay.orders.create({
    amount: opts.amountInPaise,
    currency: opts.currency ?? "INR",
    receipt: opts.receipt,
    notes: {
      x402_tx_hash: opts.receipt,
      session_id: opts.sessionId,
      source: "zapai",
      ...(opts.notes ?? {}),
    },
  });

  return order;
}

// ── Standard Payment Links ─────────────────────────────────────────────────────
// NOTE: UPI Payment Links are NOT supported in Razorpay test mode.
// Use Standard Payment Links only — they support explicit Success/Failure in test mode.

interface CreatePaymentLinkOptions {
  amountInPaise: number;
  description: string;
  customerPhone?: string;
  callbackUrl: string;
  referenceId: string;   // order_id for reconciliation
}

export async function createStandardPaymentLink(opts: CreatePaymentLinkOptions) {
  // @ts-ignore — Razorpay SDK typing is incomplete; cast to any to avoid TS errors
  const link = await (razorpay.paymentLink.create as Function)({
    amount: opts.amountInPaise,
    currency: "INR",
    description: opts.description,
    callback_url: opts.callbackUrl,
    callback_method: "get",
    reference_id: opts.referenceId,
    ...(opts.customerPhone && {
      customer: { contact: opts.customerPhone },
    }),
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes: {
      source: "zapai",
      reference_id: opts.referenceId,
    },
  }) as { short_url: string; id: string };

  return link;
}

// ── Webhook Signature Verification ───────────────────────────────────────────

/**
 * Verify Razorpay webhook HMAC-SHA256 signature.
 * Must be called with the raw request body (Buffer), not parsed JSON.
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is required");

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");

  if (expectedBuf.length !== receivedBuf.length) return false;

  let diff = 0;
  for (let i = 0; i < expectedBuf.length; i++) {
    diff |= expectedBuf[i] ^ receivedBuf[i];
  }
  return diff === 0;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert rupees to paise (Razorpay uses smallest currency unit) */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Generate a short human-readable order ID for display */
export function generateOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${num}`;
}
