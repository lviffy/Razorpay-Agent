import { createHash } from "crypto";
import { db } from "../db/migrate.ts";
import type { AuditIds, AuditEvent } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Audit Service — Append-Only Five-Way Audit Ledger
// Never updates. Never deletes. Checksum-chained for tamper-evidence.
// ─────────────────────────────────────────────────────────────────────────────

// SSE clients subscribed to /demo/events
export const sseClients = new Set<(data: string) => void>();

/**
 * Append an event to the audit ledger.
 * Computes checksum as SHA256(prev_checksum + JSON.stringify(payload)).
 */
export async function logEvent(
  eventType: string,
  ids: AuditIds,
  payload: Record<string, unknown>
): Promise<void> {
  // Get the previous checksum for chaining
  const { rows: prev } = await db.query<{ event_checksum: string }>(
    "SELECT event_checksum FROM audit_ledger ORDER BY id DESC LIMIT 1"
  );
  const prevChecksum = prev[0]?.event_checksum ?? "genesis";

  // Compute new checksum
  const eventChecksum = createHash("sha256")
    .update(prevChecksum + JSON.stringify(payload))
    .digest("hex");

  const storeId = ids.storeId || (payload as any)?.storeId || (payload as any)?.store_id || null;

  const { rows } = await db.query<AuditEvent>(
    `INSERT INTO audit_ledger (
      event_type, whatsapp_message_id, conversation_id,
      x402_transaction_id, razorpay_payment_id, order_id,
      payload, event_checksum, store_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      eventType,
      ids.whatsappMessageId ?? null,
      ids.conversationId ?? null,
      ids.x402TransactionId,
      ids.razorpayPaymentId ?? null,
      ids.orderId ?? null,
      JSON.stringify(payload),
      eventChecksum,
      storeId,
    ]
  );

  // Broadcast to /demo SSE clients
  const event = rows[0];
  if (event) {
    broadcastToDemo({
      type: eventType,
      ids,
      payload,
      checksum: eventChecksum,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Query audit events by any of the 5 IDs.
 */
export async function queryAudit(params: Partial<AuditIds>): Promise<AuditEvent[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.x402TransactionId) {
    conditions.push(`x402_transaction_id = $${idx++}`);
    values.push(params.x402TransactionId);
  }
  if (params.razorpayPaymentId) {
    conditions.push(`razorpay_payment_id = $${idx++}`);
    values.push(params.razorpayPaymentId);
  }
  if (params.orderId) {
    conditions.push(`order_id = $${idx++}`);
    values.push(params.orderId);
  }
  if (params.whatsappMessageId) {
    conditions.push(`whatsapp_message_id = $${idx++}`);
    values.push(params.whatsappMessageId);
  }
  if (params.conversationId) {
    conditions.push(`conversation_id = $${idx++}`);
    values.push(params.conversationId);
  }

  if (conditions.length === 0) return [];

  const { rows } = await db.query<AuditEvent>(
    `SELECT * FROM audit_ledger WHERE ${conditions.join(" OR ")} ORDER BY id ASC`,
    values
  );
  return rows;
}

/**
 * Broadcast a structured event to all /demo SSE connections.
 */
export function broadcastToDemo(data: Record<string, unknown>): void {
  const json = JSON.stringify(data);
  for (const send of sseClients) {
    try {
      send(json);
    } catch {
      sseClients.delete(send);
    }
  }
}
