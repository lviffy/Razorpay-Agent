import Razorpay from "razorpay";
import { createHmac } from "crypto";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    logger.warn("⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set, operating in fallback mode");
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

interface CreateOrderOptions {
  amountInPaise: number;
  currency?: string;
  receipt: string;       // x402_transaction_id
  sessionId: string;     // for idempotency key
  notes?: {
    conversation_id?: string;
    phone_number?: string;
    product_id?: string;
    [key: string]: string | undefined;
  };
}

export async function createOrder(opts: CreateOrderOptions) {
  const client = getRazorpayClient();
  if (!client) {
    return {
      id: `order_${Date.now()}`,
      amount: opts.amountInPaise,
      currency: opts.currency ?? "INR",
      receipt: opts.receipt,
      status: "created",
    };
  }

  const order = await client.orders.create({
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

interface CreatePaymentLinkOptions {
  amountInPaise: number;
  description: string;
  customerPhone?: string;
  callbackUrl: string;
  referenceId: string;   // order_id for reconciliation
  notes?: Record<string, string>;
}

export async function createStandardPaymentLink(opts: CreatePaymentLinkOptions) {
  const client = getRazorpayClient();
  if (!client) {
    const plinkId = `plink_${Date.now()}`;
    return {
      id: plinkId,
      short_url: `${opts.callbackUrl}?razorpay_payment_id=pay_${Date.now()}&razorpay_payment_link_id=${plinkId}&razorpay_payment_link_reference_id=${opts.referenceId}&razorpay_payment_link_status=paid`,
    };
  }

  // @ts-ignore — Razorpay SDK typing
  const link = await (client.paymentLink.create as Function)({
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
      ...(opts.notes || {}),
    },
  }) as { short_url: string; id: string };

  return link;
}

/**
 * Verify Razorpay webhook HMAC-SHA256 signature.
 * Must be called with the raw request body (Buffer or string).
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string
): boolean {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return true; // In test / development without secret set

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");

  if (expectedBuf.length !== receivedBuf.length) return false;

  let diff = 0;
  for (let i = 0; i < expectedBuf.length; i++) {
    diff |= expectedBuf[i] ^ receivedBuf[i];
  }
  return diff === 0;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function generateOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${num}`;
}
