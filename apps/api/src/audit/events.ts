import { randomBytes } from "crypto";
import { db } from "@zapai/database";
import type { AuditLedgerEntry, AuditIds } from "@zapai/types";
import { computePayloadHash, computeBlockHash, GENESIS_HASH } from "./hash-chain";

export const sseClients = new Set<(data: string) => void>();

export function broadcastToDashboard(event: Record<string, unknown>): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * Record a structured audit event to the append-only cryptographic ledger
 */
export async function logAuditEvent(params: {
  transactionId: string;
  eventType: AuditLedgerEntry["eventType"];
  actor: AuditLedgerEntry["actor"];
  payload: Record<string, unknown>;
  ids?: AuditIds;
}): Promise<AuditLedgerEntry> {
  const eventId = `evt_${randomBytes(8).toString("hex")}`;
  const timestamp = new Date().toISOString();
  const payloadHash = computePayloadHash(params.payload);

  // Retrieve previous hash from the latest audit ledger record
  let previousHash = GENESIS_HASH;
  try {
    const { rows: prev } = await db.query<{ event_checksum: string }>(
      "SELECT event_checksum FROM audit_ledger ORDER BY id DESC LIMIT 1"
    );
    if (prev.length > 0 && prev[0]?.event_checksum) {
      previousHash = prev[0].event_checksum;
    }
  } catch {
    // If DB is empty or table is fresh, use genesis
  }

  const currentHash = computeBlockHash({
    previousHash,
    eventType: params.eventType,
    actor: params.actor,
    payloadHash,
    timestamp,
  });

  const entry: AuditLedgerEntry = {
    eventId,
    transactionId: params.transactionId,
    eventType: params.eventType,
    actor: params.actor,
    payload: params.payload,
    payloadHash,
    previousHash,
    currentHash,
    timestamp,
  };

  // Write to Postgres audit_ledger
  try {
    await db.query(
      `INSERT INTO audit_ledger (
        event_type, whatsapp_message_id, conversation_id,
        x402_transaction_id, razorpay_payment_id, order_id,
        payload, event_checksum, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.eventType,
        params.ids?.whatsappMessageId ?? null,
        params.ids?.conversationId ?? null,
        params.transactionId,
        params.ids?.razorpayPaymentId ?? null,
        params.ids?.orderId ?? null,
        JSON.stringify(params.payload),
        currentHash,
        timestamp,
      ]
    );
  } catch (err) {
    console.error("Failed to insert into audit_ledger:", err);
  }

  // Real-time broadcast for dashboard UI
  broadcastToDashboard({
    ...entry,
    ids: params.ids,
  });

  return entry;
}
