import { createHash, createHmac, timingSafeEqual } from "crypto";
import type {
  AuditLedgerEntry,
  SignedAuditCheckpoint,
  CryptographicAuditReceipt,
} from "@zapai/types";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const CHECKPOINT_SECRET = process.env.AUDIT_CHECKPOINT_SECRET || "zapai_audit_checkpoint_secret_key_2026";

/**
 * RFC 8785-compliant Canonical JSON Serializer
 * Ensures deterministic string representation regardless of key insertion order.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalizeJson(item)).join(",")}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${canonicalizeJson((obj as Record<string, unknown>)[key])}`
  );
  return `{${pairs.join(",")}}`;
}

/**
 * Compute SHA-256 hash of arbitrary payload using Canonical JSON
 */
export function computePayloadHash(payload: Record<string, unknown>): string {
  const canonical = canonicalizeJson(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Compute block hash chaining previous hash with event details
 * H_n = SHA256(H_{n-1} : eventType : actor : payloadHash : timestamp)
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
 * Signs the head of an audit chain (Signed Checkpoint)
 * Protects against entire-chain database rewriting by adversary with write access.
 */
export function signAuditCheckpoint(params: {
  sequenceId: number;
  lastEventId: string;
  chainHeadHash: string;
  totalEvents: number;
  timestamp?: string;
  secret?: string;
  keyId?: string;
}): SignedAuditCheckpoint {
  const timestamp = params.timestamp || new Date().toISOString();
  const secret = params.secret || CHECKPOINT_SECRET;
  const canonicalHead = `${params.sequenceId}:${params.lastEventId}:${params.chainHeadHash}:${params.totalEvents}:${timestamp}`;
  const signature = createHmac("sha256", secret).update(canonicalHead).digest("hex");

  return {
    sequenceId: params.sequenceId,
    lastEventId: params.lastEventId,
    chainHeadHash: params.chainHeadHash,
    totalEvents: params.totalEvents,
    timestamp,
    signature,
    keyId: params.keyId || "zapai-root-anchor-v1",
  };
}

/**
 * Verifies a Signed Audit Checkpoint
 */
export function verifyAuditCheckpoint(
  checkpoint: SignedAuditCheckpoint,
  secret: string = CHECKPOINT_SECRET
): boolean {
  const canonicalHead = `${checkpoint.sequenceId}:${checkpoint.lastEventId}:${checkpoint.chainHeadHash}:${checkpoint.totalEvents}:${checkpoint.timestamp}`;
  const expectedSig = createHmac("sha256", secret).update(canonicalHead).digest("hex");
  const sigBuf = Buffer.from(checkpoint.signature, "hex");
  const expBuf = Buffer.from(expectedSig, "hex");

  return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
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

/**
 * Generates a self-contained Cryptographic Audit Receipt
 */
export function generateAuditReceipt(params: {
  chainId: string;
  transactionId: string;
  events: AuditLedgerEntry[];
  secret?: string;
}): CryptographicAuditReceipt {
  const finalHash = params.events.length > 0
    ? params.events[params.events.length - 1].currentHash
    : GENESIS_HASH;
  const lastEventId = params.events.length > 0
    ? params.events[params.events.length - 1].eventId
    : "evt_genesis";

  const checkpoint = signAuditCheckpoint({
    sequenceId: params.events.length,
    lastEventId,
    chainHeadHash: finalHash,
    totalEvents: params.events.length,
    secret: params.secret,
  });

  return {
    version: "1.0",
    chainId: params.chainId,
    transactionId: params.transactionId,
    genesisHash: GENESIS_HASH,
    events: params.events,
    finalHash,
    checkpoint,
    verifiedAt: new Date().toISOString(),
  };
}

