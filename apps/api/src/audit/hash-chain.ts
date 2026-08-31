import { createHash } from "crypto";
import type { AuditLedgerEntry } from "@zapai/types";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Compute SHA-256 hash of arbitrary payload
 */
export function computePayloadHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Compute block hash chaining previous hash with event details
 * H_n = SHA256(H_{n-1} + eventType + actor + payloadHash + timestamp)
 */
export function computeBlockHash(params: {
  previousHash: string;
  eventType: string;
  actor: string;
  payloadHash: string;
  timestamp: string;
}): string {
  const content = `${params.previousHash}:${params.eventType}:${params.actor}:${params.payloadHash}:${params.timestamp}`;
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Verifies that a chain of audit entries is cryptographically intact and untampered
 */
export function verifyAuditChainIntegrity(entries: AuditLedgerEntry[]): {
  valid: boolean;
  brokenIndex?: number;
  error?: string;
} {
  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenIndex: i,
        error: `Broken chain link at index ${i}: expected prevHash ${expectedPrevHash}, found ${entry.previousHash}`,
      };
    }

    const computedPayloadHash = computePayloadHash(entry.payload);
    if (computedPayloadHash !== entry.payloadHash) {
      return {
        valid: false,
        brokenIndex: i,
        error: `Payload tamper detected at index ${i}: computed ${computedPayloadHash}, found ${entry.payloadHash}`,
      };
    }

    const computedCurrentHash = computeBlockHash({
      previousHash: entry.previousHash,
      eventType: entry.eventType,
      actor: entry.actor,
      payloadHash: entry.payloadHash,
      timestamp: entry.timestamp,
    });

    if (computedCurrentHash !== entry.currentHash) {
      return {
        valid: false,
        brokenIndex: i,
        error: `Current hash mismatch at index ${i}: computed ${computedCurrentHash}, found ${entry.currentHash}`,
      };
    }

    expectedPrevHash = entry.currentHash;
  }

  return { valid: true };
}
