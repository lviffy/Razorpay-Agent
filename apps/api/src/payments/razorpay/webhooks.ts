import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@zapai/database";
import { env } from "../../config/env";
import type { RazorpayWebhookPayload } from "@zapai/types";

/**
 * Verifies the X-Razorpay-Signature against the exact raw request body
 */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string | Buffer;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret || env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  try {
    const expected = createHmac("sha256", secret)
      .update(params.rawBody)
      .digest("hex");

    const sigBuf = Buffer.from(params.signature, "hex");
    const expBuf = Buffer.from(expected, "hex");

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Checks if a webhook event ID was already processed.
 * If not, atomically records it to prevent duplicate execution on retries.
 */
export async function recordWebhookEventIdempotent(
  eventId: string,
  eventType: string
): Promise<{ isDuplicate: boolean }> {
  try {
    const result = await db.query(
      `INSERT INTO processed_webhook_events (payment_event_id, event_type, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (payment_event_id) DO NOTHING
       RETURNING payment_event_id`,
      [eventId, eventType]
    );

    if (result.rows.length === 0) {
      // Conflict happened, already processed
      return { isDuplicate: true };
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error("Error checking webhook idempotency:", err);
    return { isDuplicate: false };
  }
}
