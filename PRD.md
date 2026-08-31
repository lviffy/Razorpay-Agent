# ZapAI — Product Requirements Document
**Version:** 6.0  
**Date:** August 31, 2026  
**Track:** Razorpay AI Buildathon — AI Growth & Agentic Commerce  
**Status:** Final Specification & Architecture Blueprint

---

## 1. Executive Summary & One-Liner

**ZapAI turns any online store into an AI-native commerce endpoint — where Buyer Agents discover, negotiate, and pay Seller Agents autonomously in real time, backed by an x402 V2 HTTP payment boundary, a ZapAI Settlement Facilitator, and Razorpay's financial infrastructure with a safe human fallback.**

### Core Architecture Statement
> **ZapAI implements an x402 V2-compatible HTTP payment boundary with a custom `zapai-inr` payment scheme and facilitator adapter. Seller Agents issue standardized `PAYMENT-REQUIRED` challenges after an agreed deal and atomic inventory reservation. Buyer Agents evaluate the challenge against their cryptographically signed spending mandate and return a `PAYMENT-SIGNATURE`. The ZapAI Facilitator verifies the mandate, signature, order, amount, expiry, and nonce before invoking the configured INR settlement adapter. Razorpay provides the payment infrastructure and authoritative webhook events; when an unattended settlement rail is unavailable, ZapAI falls back to a Razorpay Payment Link requiring explicit human approval. This separation allows ZapAI to demonstrate x402 protocol semantics without falsely representing a human Checkout interaction as autonomous settlement.**

---

## 2. The Core Problem

When an autonomous AI Shopping Agent attempts to fulfill a user's purchase intent (e.g., *"Find running shoes under ₹4,000, size 10, delivered by Friday"*), current commerce infrastructure fails across five levels:

1. **Human-Only Web Surfaces:** Product catalogs and inventory counts are buried in human-facing HTML rather than machine-readable API endpoints or JSON-LD/MCP feeds.
2. **Static Pricing & Zero Negotiation:** There is no machine-to-machine protocol to request volume discounts, bundle accessories, or negotiate within dynamic seller bounds.
3. **No Concurrency / Hold Mechanism:** No atomic inventory locking exists to hold stock during the critical seconds between deal agreement and payment execution.
4. **No Zero-Trust Payment Delegation:** AI agents lack bounded, cryptographically signed spending mandates to authorize transactions without exposing full credentials or unrestricted bank access.
5. **Conflation of Autonomous Settlement with Human Checkout:** Existing agent demos fake autonomous settlement by opening human payment links. ZapAI provides the missing **x402 Facilitator Protocol** for real autonomous M2M commerce while using Razorpay Payment Links as an explicit **Human Fallback**.

---

## 3. High-Level Architecture: Autonomous vs. Fallback

```
┌─────────────────────────────────────────────────────────────┐
│                        BUYER AGENT                          │
│  • Cryptographic Spending Mandate: { limit, nonce, sig }    │
└──────────────────────────────┬──────────────────────────────┘
                               │ A2A Protocol (Structured JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        SELLER AGENT                         │
│  • Catalog Schema & Pricing Policy Engine                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ DEAL_ACCEPTED
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   INVENTORY RESERVATION                     │
│  • Redis Atomic Lock (TTL = 120s) + Postgres State Machine  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP 402 PAYMENT-REQUIRED
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        BUYER AGENT                          │
│  • Validates Mandate Constraints & Signs PAYMENT-SIGNATURE  │
└──────────────────────────────┬──────────────────────────────┘
                               │ PAYMENT-SIGNATURE
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      ZAPAI FACILITATOR                      │
│  • Server-Side Zero-Trust Mandate Verification              │
│  • Checks: Signature ∧ Expiry ∧ Nonce ∧ Amount ∧ Merchant   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    [Autonomous Rail]               [Human Fallback Rail]
 ┌──────────────────────┐        ┌─────────────────────────┐
 │ Razorpay Adapter     │        │ Razorpay Payment Link   │
 │ • INR Direct Settle  │        │ • Test/Live URL         │
 │ • Auto-Debit / IMPS  │        │ • WhatsApp User Action  │
 └──────────┬───────────┘        └────────────┬────────────┘
            │                                 │
            └───────────────┬─────────────────┘
                            │ Webhook: payment.captured (HMAC-SHA256)
                            ▼
 ┌─────────────────────────────────────────────────────────┐
 │                   ORDER STATE = PAID                    │
 │ • Postgres Inventory Committed                          │
 │ • Immutable Hash-Chained Audit Ledger Logged            │
 └─────────────────────────────────────────────────────────┘
```

---

## 4. The 6 Major Modules

To ensure high cohesion, zero circular dependencies, and complete decoupling of the protocol from payment rails, the architecture is divided into 6 major modules:

```
src/
├── agents/            # Buyer & Seller AI agent orchestration and tool bindings
│   ├── buyer.ts
│   ├── seller.ts
│   └── tools.ts
├── commerce/          # Discovery, structured negotiation, dynamic offers, inventory
│   ├── discovery.ts
│   ├── negotiation.ts
│   ├── offers.ts
│   └── inventory.ts
├── mandate/           # Cryptographic spending mandate generation & policy evaluation
│   ├── types.ts
│   ├── create.ts
│   ├── verify.ts
│   └── policy.ts
├── x402/              # x402 V2 protocol specification, client, server & facilitator
│   ├── types.ts
│   ├── server.ts
│   ├── client.ts
│   ├── facilitator.ts
│   ├── verifier.ts
│   ├── settlement.ts
│   └── headers.ts
├── payments/          # Payment gateway abstraction layer and Razorpay implementation
│   ├── payment-service.ts
│   └── razorpay/
│       ├── adapter.ts
│       ├── orders.ts
│       ├── payment-links.ts
│       └── webhooks.ts
├── orders/            # Order lifecycle and state machine
│   ├── state-machine.ts
│   └── service.ts
├── audit/             # Tamper-evident hash-chained audit ledger
│   ├── events.ts
│   └── hash-chain.ts
└── whatsapp/          # WhatsApp Cloud API async worker & webhook ingress
    ├── webhook.ts
    └── messages.ts
```

---

## 5. Domain Models & Core Protocols

### 5.1 Spending Mandate Model (Zero-Trust)
The spending mandate delegates bounded purchasing power to the Buyer Agent.

```typescript
export interface SpendingMandate {
  mandateId: string;
  buyerId: string;
  spendingLimit: number; // in INR paise / currency integer
  currency: "INR";
  purpose: {
    category?: string;
    skuIds?: string[];
  };
  merchantAllowlist?: string[];
  expiresAt: string; // ISO 8601
  nonce: string;     // Unique single-use challenge
  signature: string; // Cryptographic HMAC-SHA256 or Ed25519 signature
}
```

#### Deterministic Server-Side Verification
The LLM never enforces financial rules. Verification is performed by `verifyMandate()`:
$$\text{Valid} \iff \text{Valid Signature} \land \text{Now} \le \text{ExpiresAt} \land \text{Nonce Unused} \land \text{Currency} = \text{"INR"} \land \text{Amount} \le \text{SpendingLimit} \land \text{Merchant} \in \text{Allowlist}$$

### 5.2 Structured A2A Negotiation Protocol
Buyer and Seller agents communicate strictly over machine-readable JSON events rather than unstructured freeform chat:

1. **`OFFER`**: `{ type: "OFFER", conversation_id, merchant_id, sku_id, quantity, price, currency: "INR", expires_at }`
2. **`COUNTER_OFFER`**: `{ type: "COUNTER_OFFER", offer_id, price, currency: "INR", discount, bundle_items?: [] }`
3. **`ACCEPT`**: `{ type: "ACCEPT", offer_id, agreed_price, currency: "INR" }`
4. **`REJECT`**: `{ type: "REJECT", offer_id, reason }`

### 5.3 Inventory State Machine & Atomic Locking
Inventory state transitions follow a strict two-tier mechanism:
* **Postgres (Source of Truth):** Transactional state machine:
  $$\text{AVAILABLE} \longrightarrow \text{RESERVED} \longrightarrow \text{PAYMENT\_PENDING} \longrightarrow \text{PAID (SOLD)} \quad [\text{or } \text{EXPIRED} \to \text{AVAILABLE}]$$
* **Redis (Concurrency Lock):** Key `reservation:{reservationId}` with `TTL = 120s`.

```sql
-- Atomic reservation transaction
BEGIN;
  SELECT inventory_available FROM variants WHERE id = $1 FOR UPDATE;
  -- If inventory_available >= $quantity:
  UPDATE variants 
  SET inventory_available = inventory_available - $quantity,
      inventory_reserved = inventory_reserved + $quantity
  WHERE id = $1;
  INSERT INTO reservations (id, variant_id, quantity, expires_at, status) 
  VALUES ($2, $1, $3, NOW() + INTERVAL '120 seconds', 'RESERVED');
COMMIT;
```

### 5.4 The x402 V2 Protocol Semantics (`zapai-inr`)
ZapAI adheres to modern x402 V2 standards:
* **HTTP 402 Response:** Contains standard header `PAYMENT-REQUIRED: <base64-encoded-payload>`:
```json
{
  "scheme": "exact",
  "network": "zapai-inr",
  "amount": "379900",
  "asset": "INR",
  "payTo": "merchant_runfast",
  "resource": "order/ORD-1042",
  "expiresAt": "2026-08-31T18:35:00Z",
  "nonce": "n_98a7fbc3"
}
```
* **Buyer Payment Authorization:** Transmitted via header `PAYMENT-SIGNATURE: <base64-encoded-payload>`:
```json
{
  "paymentId": "zap_pay_89123",
  "mandateId": "mandate_7781",
  "resource": "order/ORD-1042",
  "amount": "379900",
  "currency": "INR",
  "nonce": "n_98a7fbc3",
  "timestamp": "2026-08-31T18:33:10Z",
  "signature": "sig_ed25519_abc123..."
}
```

### 5.5 Tamper-Evident Hash-Chained Audit Ledger
Every single state transition, reasoning step, negotiation event, mandate verification, and money movement is immutably linked via a SHA-256 cryptographic hash chain:
$$H_n = \text{SHA256}(H_{n-1} \parallel \text{Payload}_n \parallel \text{Timestamp}_n)$$

---

## 6. Razorpay Integration & Webhook Handling

1. **Order Creation:** Uses Razorpay Orders API (`POST /v1/orders`) with idempotency key `receipt: {x402_payment_id}`.
2. **Webhook Verification:** Raw body verified using HMAC-SHA256 (`X-Razorpay-Signature`).
3. **Idempotency Defense:** `x-razorpay-event-id` stored in `processed_webhook_events` table before processing any state mutation.
4. **Out-of-Order Resilient States:**
   * `PAYMENT_PENDING` $\rightarrow$ handles `payment.authorized`, `payment.captured`, and `payment.failed` idempotently.

---

## 7. Demo Flow & Dashboard Visualizer

### Dashboard Status Badges
To provide total clarity to judges, every transaction step displays an explicit status badge:
* 🟢 **AUTONOMOUS** (Agent-to-Agent discovery, negotiation, inventory reservation, x402 mandate signing)
* 🟡 **HUMAN APPROVAL** (When falling back to Razorpay Payment Link)
* 🔴 **FAILED / REJECTED** (Budget exceeded, lock conflict, or signature invalid)

### The Demo Steps
1. **WhatsApp Inbound Intent:** User: *"Find me the best running shoes under ₹4,000."*
2. **Parallel Discovery:** Buyer Agent queries mock stores (**RunFast Sports** and **SpeedGear**) simultaneously.
3. **Structured Negotiation:** Buyer Agent negotiates ₹3,999 down to ₹3,799 + free shipping with RunFast Seller Agent.
4. **Lock & x402 Challenge:** RunFast Seller Agent atomically locks inventory (120s TTL) and returns HTTP 402.
5. **Mandate Verification & Signing:** Buyer Agent verifies mandate budget (₹3,799 $\le$ ₹4,000) and produces `PAYMENT-SIGNATURE`.
6. **Facilitator Execution:** ZapAI Facilitator validates cryptographic proof and executes settlement.
7. **Fallback Showcase:** If autonomous rail is bypassed, seamlessly creates a Razorpay Payment Link.
8. **Audit Trail Verification:** Live visualizer proves 100% cryptographic continuity across all 9 event nodes.

---

## 8. Explicit Non-Goals (Scope Pruning for Buildathon)

To guarantee 100% demo reliability under pressure, the following are strictly deprioritized:
* ❌ Real Shopify OAuth / Admin App onboarding (two pre-seeded mock stores in Neon DB).
* ❌ Multi-currency crypto conversions (focus is 100% on fiat INR settlement).
* ❌ Complex multi-tier refund engines or marketplace payout splitting.
* ❌ Production WhatsApp Business verification delays (uses test credentials with async worker).

---

## 9. 7-Phase Execution Plan

1. **Phase 1 — Core Domain & Mandates:** Types, spending mandate model, deterministic policy engine.
2. **Phase 2 — A2A Commerce & Negotiation:** Structured event state machine, discovery, and seller pricing engine.
3. **Phase 3 — Inventory Locking:** Postgres transactions + Redis atomic TTL reservation.
4. **Phase 4 — x402 V2 Protocol & Facilitator:** Headers, verifier, client/server handlers, and settlement coordinator.
5. **Phase 5 — Razorpay Integration:** Orders API, Payment Link fallback, raw body webhook verification, and event deduplication.
6. **Phase 6 — Hash-Chained Audit Ledger:** Event store, SHA-256 chaining, and trace visualization endpoints.
7. **Phase 7 — End-to-End Demo & UI:** WhatsApp worker integration, real-time SSE dashboard, and status badges.
