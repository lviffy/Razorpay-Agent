import type { PaymentStatus } from "@zapai/types";

const VALID_TRANSITIONS: Record<string, string[]> = {
  CREATED: ["AUTHORIZED", "CAPTURED", "PENDING_HUMAN_APPROVAL", "FAILED"],
  PENDING_HUMAN_APPROVAL: ["AUTHORIZED", "CAPTURED", "FAILED"],
  AUTHORIZED: ["CAPTURED", "FAILED"],
  CAPTURED: ["REFUNDED"],
  FAILED: ["CREATED"], // allow retry
  REFUNDED: [],
};

/**
 * Validates if an order state transition is allowed
 */
export function isValidOrderStateTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): boolean {
  const current = (currentStatus || "CREATED").toUpperCase();
  const next = newStatus.toUpperCase();

  if (current === next) {
    return true; // idempotent self-transition
  }

  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
