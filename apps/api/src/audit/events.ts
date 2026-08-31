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
 * Record a structured audit event to the tamper-evident cryptographic ledger
 * Uses Postgres transaction locking to ensure atomic, serializable chain head progression.
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

  let previousHash = GENESIS_HASH;
  let currentHash = "";
  let client;

  try {
    client = await db.connect();
    await client.query("BEGIN");

    // Lock the audit ledger table / head row to prevent concurrent race conditions
    const { rows: prev } = await client.query<{ event_checksum: string }>(
      "SELECT event_checksum FROM audit_ledger ORDER BY id DESC LIMIT 1 FOR UPDATE"
    );

    if (prev.length > 0 && prev[0]?.event_checksum) {
      previousHash = prev[0].event_checksum;
    }

    currentHash = computeBlockHash({
      previousHash,
      eventType: params.eventType,
      actor: params.actor,
      payloadHash,
      timestamp,
    });

    await client.query(
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

    await client.query("COMMIT");
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback error
      }
    }
    console.error("Failed to insert into audit_ledger atomically:", err);
    // Fallback compute in-memory if DB is disconnected
    if (!currentHash) {
      currentHash = computeBlockHash({
        previousHash,
        eventType: params.eventType,
        actor: params.actor,
        payloadHash,
        timestamp,
      });
    }
  } finally {
    if (client) {
      client.release();
    }
  }

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

  // Real-time broadcast for dashboard UI
  broadcastToDashboard({
    ...entry,
    ids: params.ids,
  });

  return entry;
}

