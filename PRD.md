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

## 4. Turborepo Monorepo & System Modules

To ensure high cohesion, zero circular dependencies, and complete decoupling of the protocol from payment rails, the system is organized as a Turborepo monorepo:

```
Razorpay-Agent/
├── apps/
│   ├── api/                    # Express + Bun API Server
│   │   └── src/
│   │       ├── audit/          # RFC 8785 Canonical JSON & SHA-256 hash-chain engine
│   │       ├── commerce/       # Discovery, structured negotiation & 120s TTL inventory locking
│   │       ├── mandate/        # Cryptographic spending mandate signing & deterministic policy
│   │       ├── x402/           # x402 V2 protocol, facilitator coordinator, headers & verifier
│   │       ├── payments/       # Gateway abstraction & Razorpay 5-service financial suite
│   │       │   └── razorpay/   # AutoPay, Offers, Route, Refunds, Disputes, Orders, Webhooks
│   │       ├── orders/         # Order state machine & lifecycle persistence
│   │       ├── integrations/   # LLM (Groq/Gemini), Razorpay, Redis, Shopify, WhatsApp
│   │       ├── modules/        # Modular routers (agent, checkout, growth-ai, dashboard, etc.)
│   │       ├── services/       # Core business services & conversation memory
│   │       └── workers/        # Async queue workers
│   └── web/                    # Next.js 15 App Router Frontend (Dashboard & Landing UI)
│       ├── app/                # App router pages (dashboard, analytics, audit, products, etc.)
│       └── components/         # Interactive UI components, visualizers, playgrounds
└── packages/
    ├── database/               # Neon PostgreSQL client, schemas, migrations, seeders
    └── types/                  # Shared TypeScript domain models and A2A event contracts
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
  SELECT id, sku, inventory_available, inventory_reserved 
  FROM products WHERE id = $1 FOR UPDATE;

  -- If inventory_available >= $quantity:
  UPDATE products 
  SET inventory_available = inventory_available - $quantity,
      inventory_reserved = inventory_reserved + $quantity,
      inventory_state = 'RESERVED',
      reservation_expires_at = NOW() + INTERVAL '120 seconds',
      updated_at = NOW()
  WHERE id = $1 AND inventory_available >= $quantity;
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

### 5.5 Tamper-Evident Hash-Chained Audit Ledger & Signed Checkpoints
Every single state transition, reasoning step, negotiation turn, mandate verification, and payment capture is linked in an append-only, tamper-evident cryptographic hash chain:

$$H_n = \text{SHA256}(H_{n-1} : \text{eventType} : \text{actor} : \text{payloadHash} : \text{timestamp})$$

* **RFC 8785 Canonical JSON:** $\text{payloadHash} = \text{SHA256}(\text{canonicalize\_rfc8785}(\text{payload}))$ guarantees deterministic key ordering across all platforms.
* **External Trust Anchor:** Chain head $H_8$ is signed via Ed25519 (`zapai-root-anchor-v1`) to prevent whole-database rewrite attacks.
* **Concurrency Protection:** PostgreSQL `SELECT event_checksum ... FOR UPDATE` locks inside transactions prevent race conditions during concurrent event insertion.
* **Self-Contained Audit Receipts:** Exportable `zapai-audit-receipt.json` with embedded genesis hash, checkpoints, and offline verification commands.

---

## 6. Razorpay Financial Infrastructure & 5 Core Services

ZapAI integrates deeply with Razorpay across 5 distinct financial modules:

1. **UPI AutoPay & e-Mandates (`autopay.ts`):** Zero-touch autonomous tokenized debits up to RBI ₹15,000 limit (`RBI_SUB_MANDATE_MAX_PAISE = 1500000`) without secondary OTP popups.
2. **Dynamic Offers Engine (`offers.ts`):** Querying Razorpay Offers API to inject live bank cashbacks & card discounts into A2A counter-offers.
3. **Razorpay Route (`route.ts`):** Multi-vendor bundle order split transfers (Shoes + Socks) with automated platform take-rate deduction.
4. **Programmatic Instant Refunds (`refunds.ts`):** Sub-second algorithmic refunds (`speed: "instant" | "optimum"`) when inventory drops or fulfillment constraints fail.
5. **Cryptographic Dispute Evidence Chaining (`disputes.ts`):** Generating tamper-evident SHA-256 dispute proof bundles for automated chargeback defense.
6. **Orders API & Webhook Ingress (`orders.ts` & `webhooks.ts`):** Idempotent order creation with receipt key `receipt: {x402_tx_hash}`, raw-byte HMAC-SHA256 signature verification, and deduplication via `processed_webhook_events`.

---

## 7. Demo Flow & Dashboard Visualizer

### Dashboard Status Badges
To provide total clarity to judges, every transaction step displays an explicit status badge:
* 🟢 **AUTONOMOUS** (Agent-to-Agent discovery, negotiation, inventory reservation, x402 mandate signing)
* 🟡 **HUMAN APPROVAL** (When falling back to Razorpay Payment Link)
* 🔴 **FAILED / REJECTED** (Budget exceeded, lock conflict, or signature invalid)

### The 8-Stage Demo Steps
1. **WhatsApp Inbound Intent:** User: *"Find me the best running shoes under ₹4,000."* (`INTENT_RECEIVED`)
2. **Mandate Creation & Signing:** Buyer Agent creates a cryptographically signed spending mandate with nonce and bounds. (`MANDATE_CREATED`)
3. **Structured Negotiation:** Buyer Agent negotiates ₹3,999 down to ₹3,799 + free shipping with RunFast Seller Agent. (`DEAL_ACCEPTED`)
4. **Lock & Reservation:** RunFast Seller Agent atomically locks inventory (120s TTL in Redis + Postgres row lock). (`INVENTORY_RESERVED`)
5. **x402 V2 Challenge:** RunFast Seller Agent issues machine-readable HTTP 402 challenge (`zapai-inr`). (`PAYMENT_REQUIRED`)
6. **Mandate Verification & Authorization:** Buyer Agent signs `PAYMENT-SIGNATURE`; ZapAI Facilitator verifies zero-trust rules. (`PAYMENT_AUTHORIZED`)
7. **Razorpay Payment Capture:** Razorpay webhook confirms payment capture with raw-byte HMAC-SHA256 verification. (`PAYMENT_CAPTURED`)
8. **Order Commit & Anchor:** Order status flips to `COMMITTED`, inventory to `PAID`, signed checkpoint anchored, and receipt dispatched. (`ORDER_CREATED`)

### Interactive Visual Verification Engine
* **Verify Integrity**: Live WebCrypto client-side SHA-256 validation across all 8 blocks in `<0.5ms`.
* **Simulate Tampering**: Mutates Block #3 settled price (₹3,799 $\to$ ₹2,500) and displays immediate cryptographic link severance and red downstream cascade.
* **Download Receipt**: Exports `zapai-audit-receipt.json` with Ed25519 signature and offline verification snippet.

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
