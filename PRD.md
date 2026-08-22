# AgentBridge — Product Requirements Document
**Version:** 5.0  
**Date:** August 20, 2026  
**Track:** Razorpay AI Buildathon — AI Growth & Agentic Commerce  
**Status:** Final Submission Draft

---

## One-Liner

AgentBridge turns any Shopify store into an AI-native commerce endpoint — where Buyer Agents discover, negotiate, and pay Seller Agents autonomously in real time, with every rupee settled in INR through Razorpay's payment infrastructure.

---

## The Problem (In One Scene)

It's 2am. A Buyer Agent is executing a task: *"Buy the best running shoes you can find under ₹4,000."* The user set their budget, pre-authorized a spending limit, and went to sleep.

Here is what the agent actually encounters:

- **Five Shopify storefronts** — all HTML designed for human eyes, not machine parsing. Product attributes are buried in unstructured text. Inventory numbers either don't exist or were last updated six hours ago.
- **No negotiation surface** — prices are fixed. There is no API endpoint to ask "will you do ₹3,500 with free shipping?" A human could WhatsApp the merchant; the agent cannot.
- **No way to reserve** — even if the agent finds the right product at the right price, nothing stops another buyer from purchasing it in the 30 seconds it takes to confirm.
- **No programmable payment path** — the only checkout options are a browser-based UPI flow or a Razorpay payment link that requires a human to click it. The agent has no mechanism to pay on behalf of the user programmatically, with a bounded limit, and receive a verifiable receipt.
- **Even if payment works** — existing systems lack native agent friendliness and real-time bank settlement. The Shopify merchant in Bengaluru needs INR in their bank account immediately, not trapped in delays or non-fiat wallets.

**Result: The merchant loses a high-intent sale. The agent fails its task. The user wakes up to nothing. The agentic commerce channel — which Razorpay, NPCI, and global protocols like x402 are actively building — sits completely unused.**

AgentBridge is the missing layer that fixes all five failures in a single integration.

---

## Root Causes

The problem is not just a bad API design. It is a structural mismatch across three independent layers that nobody has resolved together yet.

### 1. Merchants Have No Agent-Ready Storefront

Indian Shopify merchants — especially SMBs and D2C brands — have invested heavily in their catalogs, fulfillment pipelines, and WhatsApp Business presence. But every one of these surfaces was designed for a human shopper. There is no machine-readable product schema, no real-time inventory API accessible without a developer integration, and no concept of a "programmatic buyer." As a result, when AI shopping agents emerge as a meaningful channel (which is happening now), these merchants are effectively invisible to them. Their WhatsApp catalogs are static PDFs dressed as chat messages. Their Shopify stores are walled behind human checkout flows. Their agent-driven GMV today is exactly zero — not because they don't want it, but because the infrastructure to receive it does not exist.

### 2. Buyer Agents Have No Commerce Primitive

An AI Buyer Agent today can search the web, summarize product reviews, and recommend the best option. What it cannot do is *act*: query live stock, negotiate price within a bounded budget, hold inventory for 5 minutes while it compares alternatives, and complete a payment with a verifiable receipt — all without human intervention. These are not edge cases; they are the core of autonomous commerce. Without them, AI agents are research tools, not purchasing tools. The missing primitive is a standardized, payment-native, agent-to-agent commerce interface. That interface does not exist at scale for Indian Shopify merchants.

### 3. The Settlement Layer Has a Structural Gap

The x402 protocol (HTTP 402 Payment Required) solves the agent-to-agent payment handshake elegantly: an agent requests a resource, the server responds with a payment challenge, the agent signs and pays, and the resource is unlocked. It is clean, programmable, and auditable. But for Indian commerce, x402 must be fiat-native. Merchants need INR in their bank accounts directly and instantly. They need Razorpay's regulatory cover, UPI-first routing, high-success optimization, and Instant Settlements (within 10–15 seconds). Meanwhile, Razorpay's existing payment surfaces — Orders API, Payment Links, Checkout — were designed for human-triggered flows and do not natively speak x402 or support agent-signed payment authorizations.

**AgentBridge bridges this gap:** x402 handles the machine-readable HTTP challenge/response protocol; Razorpay handles everything from order creation to Instant INR settlement. Neither replaces the other. Together, they make agentic commerce real for Indian merchants.

---

## Solution Overview

AgentBridge is a three-layer intelligent middleware that connects Shopify stores to the agentic commerce economy via WhatsApp, with Razorpay as the settlement and trust backbone.

### Layer 1 — Merchant Catalog & Inventory Service

For the buildathon scope, two mock merchants (**RunFast Sports** — Bengaluru, and **SpeedGear** — Mumbai) are pre-seeded directly into Neon DB with products, variants, pricing, negotiation rules, and live inventory counts. No live Shopify OAuth or GraphQL sync is required — the merchant data layer is a thin TypeScript service (`src/services/merchant.ts`) that reads and writes structured product data from Postgres.

Each merchant record includes:

- **Agent-Readable Product Schema** — structured JSON with variant IDs, listed price, floor price, live inventory counts, and negotiation bounds — consumed directly by the Seller Agent
- **Negotiation Rules** — per-merchant discount limits, free shipping thresholds, and bundle triggers stored in the `negotiation_rules` table

Inventory state follows an explicit state machine: `AVAILABLE → RESERVED → PAYMENT_PENDING → PAID/SOLD`. Postgres is the source of truth; Redis holds a temporary atomic lock during the reservation window (TTL = 120s).

### Layer 2 — Dual AI Agent System

Two agents go live for every connected store. This is the core of the product.

**The Seller Agent** operates on behalf of the merchant. It is initialized with the merchant's catalog schema and a set of configurable negotiation rules. For example:

- *"Allow up to 8% discount on orders above ₹2,000"*
- *"Offer free shipping on footwear orders above ₹3,000"*
- *"Never go below cost price: ₹1,800 for SKU-SHOE-001"*
- *"Bundle the running shoes with socks if the buyer hesitates"*

The Seller Agent can answer product queries, suggest alternatives based on buyer preferences, generate dynamic offers within the merchant's bounds, and critically — lock inventory atomically when a deal is agreed. It operates entirely within the guardrails the merchant defines. It never discounts more than allowed, never promises stock it has not confirmed, and never accepts payment instructions from outside the verified Buyer Agent protocol.

**The Buyer Agent** operates on behalf of the end consumer. It is initialized with a natural language task and a pre-authorized spending limit. It can search across one or many AgentBridge-connected stores simultaneously, compare live offers side by side, conduct multi-turn price negotiations with Seller Agents, and execute a purchase when it finds a deal within budget. The Buyer Agent is bounded — it cannot spend more than the pre-authorized limit, cannot purchase from unverified stores, and produces a full reasoning trace for every decision it makes.

Both agents communicate over a defined Agent-to-Agent (A2A) protocol — structured and auditable, not freeform chat. Every offer, counter-offer, acceptance, and rejection is a signed, logged event. The Buyer Agent queries **both stores in parallel**, compares live offers, and selects the best deal within the spending mandate.

The Buyer Agent is initialized with an **AP2-inspired spending mandate**: `{ mandate_id, spending_limit, currency, purpose, expires_at, status, signature }`. The agent literally cannot authorize a payment exceeding the mandate limit — enforced both in the agent tool layer and independently on the server.

### Layer 3 — Payment and Settlement

This is where AgentBridge makes money actions real. When the Buyer Agent and Seller Agent reach an agreed price and the inventory is locked, the payment flow begins:

```
[1] Buyer Agent signals: "Accepted — ₹3,799 for SKU-SHOE-001, QTY 1"
         ↓
[2] Seller Agent issues HTTP 402 Payment Required (x402 challenge)
    → Contains: amount, currency, recipient address, expiry (120 seconds)
         ↓
[3] AgentBridge intercepts x402 challenge
    → Converts to Razorpay Order via Orders API
    → Order amount: ₹3,799 | currency: INR | receipt: {x402_hash}
         ↓
[4] Razorpay Optimizer selects payment method
    → UPI (primary, highest success rate for this amount)
    → Auto-fallback to Card or Netbanking if UPI fails
         ↓
[5] Razorpay Standard Payment Link created and sent via WhatsApp (CTA button)
         ↓
[6] User opens link → approves in Razorpay Test Checkout (explicit Success/Failure choice)
         ↓
[7] Razorpay fires payment.captured webhook to AgentBridge
    → HMAC-SHA256 signature verified; idempotency key checked against processed_webhook_events
         ↓
[8] Inventory state machine: PAYMENT_PENDING → PAID (Postgres)
    → Redis lock key deleted
    → Order record written to Neon DB
         ↓
[9] WhatsApp confirmation sent to buyer:
    → Includes: whatsapp_message_id, conversation_id, x402_transaction_id, razorpay_payment_id, order_id
         ↓
[10] /demo dashboard updated via SSE — full timeline visible to judges
```

The merchant never touches crypto. The agent never directly handles money. Every step is event-driven and fully logged.

---

## How AgentBridge Uses Razorpay — The Deep Integration

This is not a wrapper around a payment link. Each Razorpay capability is used for a specific, intentional reason.

| Feature / Category | Razorpay API / Product | Why This Specific API / What It Does for AgentBridge |
|---|---|---|
| Create order before payment | **Orders API** | Idempotent order creation ensures no double-charge even if the agent retries; order ID is the immutable reference for the entire transaction lifecycle |
| Route to highest-success method | **Razorpay Optimizer** | Analyzes method-level success rates in real time; routes UPI-first for amounts under ₹10,000; automatically downgrades to Card/Netbanking on UPI decline — all without any code change on AgentBridge's side |
| Atomic payment confirmation | **Webhooks (`payment.captured`)** | Inventory is deducted and the Shopify order is created *only* on a confirmed `payment.captured` event — never on client-side callback, never on agent assertion. This is the anti-oversell guarantee. |
| Tamper-proof event verification | **Webhook Signature (HMAC-SHA256)** | Every incoming webhook is verified with Razorpay's secret before any state change — prevents replay attacks and spoofed payment confirmations from malicious agents |
| Human-in-the-loop fallback | **Payment Links API** | When merchant rules require human approval for orders above a threshold, AgentBridge generates a Payment Link and sends it to the merchant via WhatsApp — seamlessly bridging agent and human flows in the same session |
| Failure event handling | **Webhooks (`payment.failed`)** | On failure, inventory lock is released within 2 seconds; the Buyer Agent receives a structured failure reason and can retry or escalate — no silent failures, no stuck locks |
| Fraud and anomaly signals | **Vulcan AI** | For high-value agent orders (above ₹10,000), Vulcan risk signals are checked before order confirmation; anomalous patterns (e.g., same agent buying 50 units of the same SKU in 10 minutes) trigger a hold and merchant alert |
| Instant INR settlement to merchant | **Razorpay Instant Settlements** | Merchant receives funds in their existing bank account in ~10–15 seconds 24x7 via IMPS/UPI rails — zero waiting, no crypto friction, full compliance with Indian payment regulations |
| Settlements API + Reconciliation | **Settlements API + Reconciliation** | Programmatic control and full audit of when/how money reaches the Shopify merchant’s account; critical for transparent agent GMV reporting |
| Virtual Accounts & Identifiers | **Smart Collect 2.0** | Generates unique VPAs / Customer Identifiers so agents or humans can pay via UPI/NEFT even outside pure x402 flows; enables clean reconciliation for multi-store bundles |
| Dynamic QR Omnichannel | **QR Codes API** | Instantly generates dynamic UPI QR codes that can be sent in WhatsApp for hybrid human+agent checkouts or fallback payments |
| Recurring Purchases & Mandates | **Subscriptions / UPI AutoPay + E-mandates** | Allows Buyer Agents to set up pre-authorized recurring purchases (e.g., “restock running socks every 30 days”) with bounded spending limits |
| Frictionless Agent Authentication | **Tokenization / Saved Instruments (TokenHQ)** | Securely stores payment methods compliant with RBI guidelines so trusted Buyer Agents can complete future purchases with minimal re-authentication |
| Fallback Hosted Experience | **Payment Pages** | Fallback branded payment page for complex multi-item agent carts or when WhatsApp interactive messages hit limits |
| User Profile & Spending Context | **Customer API / Preferences** | Complements 1-click checkout — stores verified addresses, preferred UPI apps, and agent spending preferences |
| Dynamic Negotiation Discounts | **Offers / Discount Engine** | Lets Seller Agents dynamically apply or validate limited-time offers and coupon rules during agent-to-agent negotiation |
| Automated Post-Purchase Disputes | **Dispute / Chargeback Management** | Automated handling + agent notification when a payment is disputed after an autonomous agent purchase |
| Advanced Marketplace Disbursement | **RazorpayX Payouts** | Instant or scheduled payouts to merchants or split commissions to affiliate agents |
| Platform economics (post-v1) | **Route API** | Enables AgentBridge to collect a transparent percentage of agent-driven GMV as a platform fee, split cleanly at settlement across multi-store bundles |
| Instant Recovery Refunds | **Refunds API** | Programmatic instant refund triggered if inventory runs out in physical store during payment race condition |

**The architectural principle:** x402 is the agent-to-agent handshake protocol. Razorpay is the trust, routing, and settlement engine that makes that handshake real money. They operate at different layers and are not in conflict.

---

## The Audit Trail

Every completed agent purchase produces a four-way linked identifier set:

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  WhatsApp Message ID    │ ◄─────► │  Conversation ID         │
│  wamid.ABGxxxxxxxx      │         │  conv_xxxxxxxxxxxxxxxx   │
└────────────┬────────────┘         └────────────┬────────────┘
             │                                   │
             ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│  x402 Transaction ID    │ ◄─────► │   Razorpay Payment ID   │
│  x402_xxxxxxxxxxxxxxxx  │         │   pay_xxxxxxxxxxxxxxxx  │
└─────────────┬───────────┘         └─────────────────────────┘
              │
              ▼
┌─────────────────────────┐
│  Order ID               │
│  ORD-1042               │
└─────────────────────────┘
```

This **5-field linkage** is stored in an append-only audit ledger with checksum chaining. Any party — the merchant, the end consumer, a regulator, or the agent itself — can query any of the five IDs and retrieve the complete transaction history: who negotiated what, when inventory was locked, when payment was captured, and the full agent reasoning trace.

This is not a nice-to-have. In a world where AI agents are making purchasing decisions autonomously on behalf of humans, a complete, tamper-resistant audit trail is the feature that turns AgentBridge from a clever demo into a trustworthy financial system.

---

## Target Users

**Shopify Merchants (Primary)** — Indian SMBs and D2C brands who already manage their catalog on Shopify and want to reach AI buyer channels without building any new infrastructure. They need INR settlements, not crypto. They need existing fulfillment flows to keep working. They need to stay in control of pricing and discounts.

**AI Buyer Agents and Their Users** — End consumers who delegate shopping tasks to AI assistants, and the developers building those assistants. They need a standardized, reliable, agent-native interface to real Indian inventory with real programmable payments — not screen-scraped HTML or manually curated catalogs.

**Developers Building on the Agentic Stack** — Teams building custom shopping agents, procurement tools, or multi-agent commerce systems that need a production-ready Shopify + Razorpay integration with x402 support out of the box.

---

## Core Features (v1 — Buildathon Scope)

### F1 — Shopify Sync Engine
- OAuth-based store connection with one click
- Full product catalog sync: title, description, variants, images, pricing, tags, collections
- Real-time inventory sync via `inventory_levels/update` webhook
- Agent-readable product schema generation (JSON, structured)
- WhatsApp interactive catalog generation (parallel output)
- Automatic re-sync on any product or inventory change

### F2 — Seller Agent
- Initialized per connected store with catalog schema + merchant negotiation rules
- Handles natural language product queries with structured responses
- Multi-turn negotiation within configurable discount bounds
- Dynamic offer generation (discounts, bundles, free shipping triggers)
- Atomic inventory reservation on deal agreement (Redis TTL lock, 5-minute default)
- Escalation to human merchant on out-of-bounds requests
- Full reasoning trace logged for every negotiation turn

### F3 — Buyer Agent
- Initialized with natural language task + pre-authorized spending limit
- Multi-store search and offer comparison in parallel
- Multi-turn negotiation with one or more Seller Agents
- Autonomous payment trigger when deal fits within budget
- Complete decision log (why it chose this store, this product, this price)
- Spending guardrails enforced at every step — cannot exceed pre-authorized limit

### F4 — WhatsApp Native Interface
- Conversational storefront via WhatsApp Business Cloud API
- Interactive elements: catalog cards, list pickers, quick-reply buttons
- Persistent conversation memory across sessions
- Hybrid mode: human and agent can participate in the same thread
- Merchant admin commands via WhatsApp (pause agent, override price, check GMV)

### F5 — Payment and Settlement Layer (Razorpay Core)
- x402 challenge issuance by Seller Agent on deal agreement
- AgentBridge x402-to-Razorpay conversion layer
- Razorpay Order creation with x402 hash as receipt reference
- Optimizer-driven method selection (UPI-first, auto-fallback)
- Webhook-based atomic confirmation (`payment.captured`)
- HMAC-SHA256 signature verification on every webhook
- Payment Links fallback for human-approval flows
- `payment.failed` handling with lock release and agent retry
- Vulcan risk check on high-value orders
- Shopify order write-back post-capture
- Four-way audit ID generation and storage

---

## Demo Flow (What Runs Live at the Buildathon)

One complete path, built to run without failure in front of judges.

**Setup (pre-demo):** Two Shopify demo stores are pre-connected. Store A sells running shoes (₹3,999 listed). Store B sells the same shoes (₹4,199 listed). Both are synced. Both Seller Agents are live.

**The Demo:**

1. Judge sends WhatsApp message: *"Find me running shoes under ₹4,000. Best deal wins."*
2. Buyer Agent queries both Seller Agents simultaneously with structured product request
3. Store B Seller Agent returns ₹4,199 — over budget, negotiation attempted
4. Store A Seller Agent returns ₹3,999 — within budget, but Buyer Agent pushes: *"Any room on price if I buy now?"*
5. Store A Seller Agent checks rules → offers ₹3,799 with free shipping (within 8% discount bound)
6. Buyer Agent accepts → Seller Agent locks inventory (5-minute Redis TTL) → x402 challenge issued
7. AgentBridge converts to Razorpay test-mode Order → Optimizer routes to UPI
8. Judge approves mock UPI payment → `payment.captured` webhook fires
9. Signature verified → inventory deducted → Shopify order created (Order #1042 shown live)
10. WhatsApp confirmation sent: *"Done. Razorpay pay_Xyz123 | Shopify Order #1042 | x402 tx_abc | Thread ID wa_789"*

**Total elapsed time:** Under 90 seconds.

**Failure path (shown immediately after):** Judge asks the team to trigger a UPI timeout. `payment.failed` webhook fires. Lock releases in 2 seconds. Seller Agent responds: *"Payment failed. Shoes still available for 3 minutes. Retry or try a different method?"* Buyer Agent retries via Payment Link. Payment succeeds. Audit log shows both the failure and the successful retry, timestamped.

---

## What Is Explicitly Out of Scope for v1

The following are real features that will be built in v2 — they are excluded from the buildathon submission to protect demo quality:

- Multi-currency support beyond INR
- Refunds, returns, and partial fulfillment write-back
- Merchant analytics dashboard (web UI)
- Route API commission splits
- Production WhatsApp Business API number (demo uses test credentials)
- Custom fulfillment flows beyond Shopify order creation
- Non-commerce multi-agent orchestration

---

## Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| Discovery → payment confirmation | < 90 seconds | Timed in live demo |
| Agent purchase completion rate | > 70% across test runs | Pre-demo test suite |
| Inventory consistency (no overselling) | 100% — zero tolerance | Atomic lock + webhook-only deduction |
| Razorpay webhook → Shopify order latency | < 5 seconds | Event log timestamps |
| Audit trail completeness | 4-way ID on every order | Automated assertion in test suite |
| Payment failure recovery time | < 2 seconds for lock release | Event log timestamps |

---

## Failure Recovery — Detailed Paths

### Path 1: UPI Payment Timeout
- `payment.failed` webhook received with reason: `TRANSACTION_NOT_FOUND`
- AgentBridge releases Redis inventory lock immediately
- Seller Agent sends: *"UPI payment timed out. Inventory is held for 3 more minutes. Want to retry or switch to card payment?"*
- Buyer Agent retries via Razorpay Payment Link (Card/Netbanking)
- On success: standard happy path resumes from step 7
- Full event log: failure reason, lock release timestamp, retry method, final outcome

### Path 2: Inventory Conflict (Race Condition)
- Buyer Agent accepts deal; lock attempt fails (another buyer already holds lock)
- Seller Agent responds: *"That size just sold. Here is the next available: Size 10 at ₹3,799 — same offer."*
- Buyer Agent evaluates alternative; negotiation continues from current state
- No payment is attempted until a new lock is confirmed

### Path 3: Agent Exceeds Spending Limit
- Seller Agent's best offer (₹3,899) exceeds Buyer Agent's pre-authorized limit (₹3,800)
- Buyer Agent does not accept — logs: *"Best available price exceeds pre-authorized budget by ₹99. Escalating to user."*
- WhatsApp message sent to user: *"Found shoes at ₹3,899 — ₹99 over your budget. Approve the extra?"*
- User approves or rejects; agent acts accordingly
- Full decision log preserved

---

## Technical Architecture

### System Components

```
┌──────────────────────────────────────────────────────┐
│                    WhatsApp Cloud API                 │
│              (inbound messages + outbound)            │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│                  AgentBridge Core                     │
│                                                       │
│   ┌─────────────┐       ┌──────────────────────┐     │
│   │ Seller Agent│       │    Buyer Agent        │     │
│   │ (per store) │◄─────►│  (per user session)   │     │
│   └──────┬──────┘       └──────────┬───────────┘     │
│          │                         │                  │
│   ┌──────▼──────────────────────── ▼────────┐        │
│   │         A2A Negotiation Protocol         │        │
│   │      (structured offer / counter-offer)  │        │
│   └──────────────────┬───────────────────────┘        │
│                      │                                │
│   ┌──────────────────▼───────────────────────┐        │
│   │         Payment State Machine             │        │
│   │  x402 → Razorpay Order → Webhook → Lock  │        │
│   └──────────────────┬───────────────────────┘        │
│                      │                                │
│   ┌──────────────────▼───────────────────────┐        │
│   │           Audit Event Log                 │        │
│   │  (append-only, keyed by Razorpay Pay ID)  │        │
│   └──────────────────────────────────────────┘        │
└───────┬──────────────────────────┬────────────────────┘
        │                          │
┌───────▼────────┐     ┌───────────▼──────────┐
│  Shopify API   │     │    Razorpay APIs      │
│  (sync + order │     │  Orders, Optimizer,   │
│   write-back)  │     │  Webhooks, Vulcan,    │
└────────────────┘     │  Settlements, Links   │
                       └──────────────────────┘
```

### Technology Choices

| Layer | Technology | Rationale |
|---|---|---|
| Merchant data | Seeded Neon DB (Postgres) — no live Shopify sync | Two mock merchants pre-loaded with products, inventory, and negotiation rules; reliable with zero external API dependency |
| Runtime & language | **Bun** + **TypeScript 100%** | Fast startup, native TS execution, built-in test runner; no transpile step |
| Agent runtime | **Autonomous AI LLM** via function calling | Tool-call interface enforces bounded actions; LLM handles natural language negotiation |
| Agent-to-agent protocol | Fiat-Native HTTP 402 challenge/response (`X-402-*` headers) | Machine-readable payment handshake scoped to Razorpay INR flow (see ARCHITECTURE.md §3) |
| WhatsApp interface | WhatsApp Business Cloud API — **async worker pattern** | Inbound webhook returns 200 immediately; Redis queue + worker processes AI calls asynchronously |
| Payment infrastructure | Razorpay Orders + **Standard Payment Links** + Webhooks (test mode) | Standard Payment Links are verified working in test mode with explicit Success/Failure choices |
| Inventory locking | Redis `SET NX EX 120` atomic lock | Simple, correct; Postgres is source of truth for inventory state machine |
| Audit log | Neon DB (Postgres) append-only table | 5-field immutable event store with checksum chaining |
| Hosting | **Railway** | Permanent HTTPS URL used directly as Meta + Razorpay webhook endpoint; Redis plugin auto-injected |
| Database | **Neon DB** — managed serverless Postgres | Connection string in env; `migrate.ts` runs schema + seed on boot |

---

## Risks and Mitigations

| Risk | Why It Is Real | Mitigation |
|---|---|---|
| Demo reads as a WhatsApp chatbot | Most judges have seen 20 WhatsApp commerce bots | Lead with agent-to-agent negotiation screen, not product catalog. The negotiation between two AI systems is the differentiator. |
| x402 protocol is unfamiliar | Indian fintech judges may not know x402 | One-line explanation in the pitch: "x402 is the HTTP handshake; Razorpay is what moves the actual rupees." Never let x402 be the hero — Razorpay + audit trail is the hero. |
| Too ambitious for a buildathon | Complex systems break under demo pressure | Scope is locked. One happy path. One failure path. Both run 10 times before the pitch. |
| WhatsApp Business API setup | Production numbers require Meta review (days) | Use WhatsApp test credentials throughout. Show the API calls explicitly — judges understand. |
| Shopify API rate limits | Sync + negotiation + order creation under load | Webhook-first sync (not polling). Order creation is a single API call. Rate limits are not a risk at demo scale. |
| "Why not just use Razorpay Payment Links?" | Simplest objection from judges | Answer: A payment link requires a human. AgentBridge's entire point is autonomous agent-to-agent transactions with no human in the payment loop. Payment Links are the *fallback*, not the path. |

---

## Why This Wins on the Razorpay Track

Most buildathon submissions use Razorpay as a checkout page — the last mile of a human purchase flow. AgentBridge uses Razorpay as core infrastructure for a new category of commerce.

Specifically:

**Razorpay Optimizer** is not a nice-to-have here — it is the reason agent-driven payments succeed at Indian success rates. Without Optimizer, UPI timeouts would break the demo. With it, the system routes around failures automatically.

**Webhooks are the trust layer.** Every state change — inventory deduction, order creation, lock release — is gated on a Razorpay-signed webhook event. This is not engineering caution; it is the architecture that makes money actions auditable and safe.

**INR settlement is the business model unlock.** The reason AgentBridge can target Indian Shopify merchants — and not just crypto-native platforms — is that Razorpay handles the entire conversion and settlement chain. Merchants get rupees. That is the market.

**The audit trail is Razorpay's Payment ID at its center.** The four-way linkage only works because Razorpay's payment ID is the canonical reference that anchors a WhatsApp conversation, an x402 transaction, and a Shopify order into a single queryable record.
