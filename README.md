# AgentBridge — AI-Native Agentic Commerce Middleware

> **Track:** Razorpay AI Buildathon 2026 — AI Growth & Agentic Commerce  
> **Status:** Final Submission Draft  
> **Core Stack:** Bun • TypeScript • Google Gemini • Razorpay • Neon Postgres • Redis • WhatsApp Cloud API • x402 Protocol  
> **Documentation:** [PRD.md](PRD.md) • [ARCHITECTURE.md](ARCHITECTURE.md)

---

## ⚡ One-Liner

**AgentBridge turns any Shopify store into an AI-native commerce endpoint — where AI Buyer Agents discover, negotiate, reserve inventory, and pay Seller Agents autonomously in real time, with every rupee settled in INR through Razorpay's payment infrastructure.**

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Solution Overview](#-solution-overview)
- [System Architecture](#-system-architecture)
- [Dual AI Agent System](#-dual-ai-agent-system)
- [How AgentBridge Uses Razorpay](#-how-agentbridge-uses-razorpay)
- [5-Field Tamper-Proof Audit Trail](#-5-field-tamper-proof-audit-trail)
- [Tech Stack & Infrastructure](#-tech-stack--infrastructure)
- [Environment Variables](#-environment-variables)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [Demo Execution & Test Scripts](#-demo-execution--test-scripts)
- [API Reference](#-api-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Failure Recovery & Resiliency](#-failure-recovery--resiliency)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🚨 The Problem

It is 2:00 AM. A Buyer Agent is executing a task: *"Buy the best running shoes you can find under ₹4,000."* The consumer set their budget, pre-authorized a spending limit, and went to sleep.

Here is what the agent actually encounters on existing e-commerce systems:

1. **Unstructured Storefronts:** Shopify storefronts are HTML rendered for human eyes. Product attributes are buried in unstructured text, and real-time inventory counts are inaccessible without custom integrations.
2. **Fixed Prices & No Negotiation Surface:** Prices are static. There is no machine-readable API endpoint to ask *"Will you accept ₹3,700 with free shipping for instant checkout?"*
3. **No Reservation Mechanism:** Even if the agent finds the right item, nothing prevents another buyer from purchasing it during the 30-second decision window.
4. **No Programmable Payment Path:** Checkout requires human interaction (e.g., clicking a UPI deep-link or entering OTPs). The agent cannot programmatically pay within a pre-authorized mandate and receive a cryptographic receipt.
5. **Settlement & Fiat Gap:** Global protocols like x402 are often tied to web3 or non-fiat tokens. Indian Shopify merchants require **instant bank settlement in INR** compliant with Indian banking regulations.

**Result:** The merchant loses a high-intent sale. The agent fails its mandate. The consumer wakes up empty-handed. **AgentBridge bridges all five failures in a single integration layer.**

---

##💡 Solution Overview

AgentBridge operates as a three-layer intelligent middleware connecting e-commerce platforms to the agentic economy, backed by Razorpay as the financial and trust engine.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 BUYER ECOSYSTEM                                  │
│   ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────┐  │
│   │ Autonomous Buyer Agent │   │ Consumer on WhatsApp   │   │ Procurement Bot │  │
│   └───────────┬────────────┘   └───────────┬────────────┘   └────────┬────────┘  │
└───────────────┼────────────────────────────┼─────────────────────────┼───────────┘
                │                            │                         │
                ▼ (x402 Fiat HTTP)           ▼ (WhatsApp Cloud API)    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          AGENTBRIDGE GATEWAY & ROUTER                            │
│       • API Gateway (Express/Bun)        • HMAC Webhook Verification             │
│       • Async Job Queue (Redis)          • Dual-Agent Orchestration Engine       │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────────────────┐
│                          CORE DISTRIBUTED SERVICES                               │
│                                                                                  │
│   ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────┐  │
│   │   Seller Agent (LLM)   │   │   Buyer Agent (LLM)    │   │  Redis Redlock  │  │
│   │  Merchant Rules Engine │   │   AP2 Mandate Guard    │   │ Locking Engine  │  │
│   └───────────┬────────────┘   └───────────┬────────────┘   └────────┬────────┘  │
│               │                            │                         │           │
│   ┌───────────▼────────────┐   ┌───────────▼────────────┐   ┌────────▼────────┐  │
│   │   Razorpay Payment     │   │  Postgres DB (Neon)    │   │ 5-Field Audit   │  │
│   │   State Machine        │   │  Catalog & Inventory   │   │ Immutable Log   │  │
│   └────────────────────────┘   └────────────────────────┘   └─────────────────┘  │
└───────────────────┬─────────────────────────────────────────────┬────────────────┘
                    │                                             │
                    ▼                                             ▼
┌──────────────────────────────────────┐     ┌─────────────────────────────────────┐
│          RAZORPAY FINANCIAL BUS      │     │           SHOPIFY MERCHANTS         │
│   • Orders API & Optimizer           │     │   • Structured Catalog JSON         │
│   • Instant Settlements (IMPS/UPI)   │     │   • Real-Time Inventory Updates     │
│   • Smart Collect & Virtual Accounts │     │   • Merchant Guardrail Rules        │
│   • Vulcan AI & Fraud Risk Signals   │     │   • Order Write-Back                │
└──────────────────────────────────────┘     └─────────────────────────────────────┘
```

### Layer 1 — Merchant Catalog & Inventory Engine
- Serves agent-readable structured JSON schemas (variant IDs, listed price, floor price, live stock counts).
- Configurable merchant negotiation guardrails stored in Postgres (e.g., max discount percentage, free shipping triggers, bundle rules).
- State-machine driven inventory: `AVAILABLE → RESERVED → PAYMENT_PENDING → PAID/SOLD`.
- Atomic Redis TTL lock (`120s`) prevents race conditions and double-selling.

### Layer 2 — Dual AI Agent System (A2A Engine)
- **Seller Agent:** Operates per store. Evaluates incoming buyer requests against merchant guardrails, performs multi-turn counter-offers, and locks inventory atomically upon agreement.
- **Buyer Agent:** Acts on behalf of the consumer. Receives a natural-language mandate + pre-authorized spending limit, searches multiple store catalogs in parallel, conducts negotiations, and triggers payment when terms are met.
- **A2A Protocol:** Structured, signed HTTP exchange (`X-402-*` headers) ensuring auditable offer history.

### Layer 3 — Payment & Settlement Stack (Razorpay Core)
- Converts x402 payment challenges directly into Razorpay Orders.
- Leverages Razorpay Optimizer for smart routing (UPI-first with fallback to Card/Netbanking).
- Gates order creation and inventory deduction strictly on verified `payment.captured` webhooks.
- Triggers **Razorpay Instant Settlement** for 10–15 second INR bank transfer to merchants.

---

## 🤖 Dual AI Agent System

AgentBridge implements two specialized LLM agents built on **Google Gemini 2.5 / Flash** with function calling:

```
[Buyer Agent] ──── (1) Search & Request Offer ────► [Store A Seller Agent]
      │                                                     │
      ├────────── (2) Search & Request Offer ────► [Store B Seller Agent]
      │                                                     │
      ◄────────── (3) Counter-Offer (₹3,799) ──────────────┘ (Within 8% Discount Guardrail)
      │
[Verifies AP2 Spending Mandate: Max ₹4,000] ✅
      │
      └────────── (4) Accept & Request Payment Challenge ──► [Seller Agent]
                                                                  │
                                                     [Locks Inventory in Redis]
                                                                  │
                                                     [Issues x402 Challenge]
```

### 1. The Seller Agent (`src/agents/seller-agent.ts`)
- Configured per merchant with business rules:
  - *Max discount percentage* (e.g., up to 8% off for orders above ₹2,000).
  - *Free shipping threshold* (e.g., free shipping on orders above ₹3,000).
  - *Floor price protection* (never accepts an offer below item cost).
- Performs atomic inventory locks (`Redis SET NX EX 120`) when an offer is accepted.

### 2. The Buyer Agent (`src/agents/buyer-agent.ts`)
- Bounded by an **AP2 Spending Mandate**:
  ```json
  {
    "mandate_id": "man_982347102938",
    "spending_limit": 4000,
    "currency": "INR",
    "purpose": "Buy running shoes",
    "expires_at": "2026-08-21T00:00:00Z"
  }
  ```
- Evaluates multiple merchants simultaneously and automatically selects the optimal deal within budget.
- Enforces strict spending checks both at the LLM tool boundary and at the server gateway.

---

## 💳 How AgentBridge Uses Razorpay

AgentBridge does not treat Razorpay as just a checkout button — it relies on Razorpay as the foundational trust, payment routing, and settlement infrastructure for autonomous agents.

| Razorpay API / Feature | Purpose in AgentBridge | Architectural Impact |
|---|---|---|
| **Orders API** | Idempotent order creation for agent payments | Prevents double-charging during agent retries; provides the immutable anchor for the 5-field audit trail. |
| **Razorpay Optimizer** | Dynamic payment method routing | Analyzes method success rates in real time; routes UPI-first for small transactions and auto-falls back to Card/Netbanking on declines. |
| **`payment.captured` Webhooks** | Anti-oversell payment confirmation | Inventory is permanently deducted and order confirmed *only* on cryptographic webhook confirmation — never client-side. |
| **`payment.failed` Webhooks** | Rapid lock release & failure recovery | Instantly releases the Redis inventory lock (within <2s) and instructs the Buyer Agent to retry via fallback options. |
| **HMAC-SHA256 Signatures** | Webhook tamper prevention | Ensures all incoming payment events originate from Razorpay, eliminating replay or spoof attacks. |
| **Payment Links API** | Human-in-the-loop fallback flow | Generates interactive payment links delivered via WhatsApp when manual merchant or buyer approval is required. |
| **Vulcan AI Scoring** | Autonomous fraud detection | Evaluates risk vectors on high-value agent transactions before order finalization. |
| **Instant Settlements** | Real-time merchant bank payout | Settles INR directly into merchant bank accounts in 10–15 seconds via IMPS/UPI rails. |
| **Smart Collect 2.0** | Agent virtual accounts & VPAs | Generates dynamic VPAs for multi-store bundle payments and bank transfer reconciliations. |
| **Route API** | Platform commission splits | Enables AgentBridge to collect automated platform fees on agent-driven GMV. |
| **Refunds API** | Race condition mitigation | Automatically issues instant refunds if physical store inventory collapses during payment transit. |

---

## 🔒 5-Field Tamper-Proof Audit Trail

Every transaction processed through AgentBridge generates a 5-way linked audit record stored in an append-only Postgres ledger:

```
┌───────────────────────────────────┐         ┌───────────────────────────────────┐
│        WhatsApp Message ID        │ ◄─────► │          Conversation ID          │
│        wamid.HBgLMTIzNDU2...      │         │     conv_7f9a2b8c1d3e4f5a         │
└─────────────────┬─────────────────┘         └─────────────────┬─────────────────┘
                  │                                             │
                  ▼                                             ▼
┌───────────────────────────────────┐         ┌───────────────────────────────────┐
│        x402 Transaction ID        │ ◄─────► │        Razorpay Payment ID        │
│    x402_9a8b7c6d5e4f3a2b1c0d      │         │       pay_PZ9x8y7z6w5v4u3t        │
└─────────────────┬─────────────────┘         └───────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────┐
│             Order ID              │
│             ORD-1042              │
└───────────────────────────────────┘
```

Any entity (merchant, buyer, auditor, or regulator) can query any of the 5 keys to retrieve the full immutable trace — including LLM reasoning steps, negotiation history, inventory lock timestamps, and bank settlement status.

---

## 🛠 Tech Stack & Infrastructure

- **Runtime Engine:** [Bun](https://bun.sh/) (v1.1+) — native TypeScript execution with built-in test runner.
- **Language:** TypeScript 100% (Strict Mode).
- **AI / LLM Orchestration:** Google Gemini 2.5 / Flash via `@google/generative-ai`.
- **Database:** Serverless Postgres via [Neon DB](https://neon.tech/).
- **In-Memory Cache & Locking:** Redis 7 (`ioredis`) for atomic inventory reservation (`SET NX EX`).
- **Payment Processing:** Official `razorpay` Node SDK.
- **Messaging Interface:** WhatsApp Business Cloud API (via Express async worker queue).
- **Protocol:** Fiat-Native HTTP 402 (`x402`).
- **Deployment & Hosting:** [Railway](https://railway.app/) with Nixpacks builder.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description | Example / Required Format |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio API Key | `AIzaSy...` |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Key Secret | `xxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks | `xxxxxxxxxxxxxxxx` |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Phone Number ID | `1006...` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API Permanent Token | `EAAG...` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Custom verification token for Meta webhook | `random_verify_token` |
| `DATABASE_URL` | Neon Postgres Connection String (pooled) | `postgresql://user:pass@ep-xxx.neon.tech/agentbridge?sslmode=require` |
| `REDIS_URL` | Redis instance connection string | `redis://localhost:6379` |
| `APP_URL` | Public server URL (Railway / ngrok) | `https://your-app.up.railway.app` |
| `PORT` | Local HTTP server port | `3000` |
| `X402_SIGNING_SECRET` | Secret key for signing x402 challenge tokens | `super_secret_x402_key` |

---

## 🚀 Quick Start & Local Setup

### Prerequisites

Ensure you have the following installed locally:
- [Bun](https://bun.sh/) (`>= v1.1.0`)
- [Docker](https://www.docker.com/) & Docker Compose (for running Redis locally)
- A managed [Neon DB](https://neon.tech/) instance (or local PostgreSQL 15+)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/lviffy/Razorpay-Agent.git
cd Razorpay-Agent
bun install
```

### 2. Start Local Redis Container

```bash
docker-compose up -d redis
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, RAZORPAY_KEY_ID, DATABASE_URL, etc.
```

### 4. Run Database Migration & Seeding

This initializes the Postgres database schema and seeds the two mock merchants (**RunFast Sports** and **SpeedGear**) along with product catalogs and negotiation rules:

```bash
bun run migrate
```

### 5. Start Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`. You can verify server health at:
```bash
curl http://localhost:3000/health
```

---

## 🧪 Demo Execution & Test Scripts

AgentBridge includes automated demo scripts to execute complete end-to-end purchasing flows without manual UI input.

### 1. Happy Path Demo Execution

Executes the full agentic commerce journey: parallel catalog search, multi-turn negotiation, inventory locking, x402 payment challenge issuance, Razorpay order creation, mock payment capture, and 5-field audit assertion.

```bash
bun scripts/run-happy-path.ts
```

**Expected Workflow Steps:**
1. Buyer Agent initialized with task: *"Find me running shoes under ₹4,000. Best deal wins."*
2. Queries both **RunFast Sports** (₹3,999) and **SpeedGear** (₹4,199) in parallel.
3. Negotiates with RunFast Sports Seller Agent → Agrees on **₹3,799 with free shipping**.
4. Seller Agent acquires Redis lock on SKU stock (`TTL = 120s`).
5. Generates HTTP 402 challenge & converts to Razorpay Order.
6. Simulates `payment.captured` webhook → Verifies signature.
7. Inventory transitions `PAYMENT_PENDING → PAID`.
8. Order `#1042` created and 5-field audit trail logged.

### 2. Failure Recovery & Lock Release Demo

Demonstrates resilience when a payment fails or times out:

```bash
bun scripts/run-failure-path.ts
```

**Expected Workflow Steps:**
1. Buyer Agent agrees on item deal & locks inventory.
2. Simulates `payment.failed` webhook (e.g., UPI timeout).
3. System captures failure and **releases Redis lock within < 2 seconds**.
4. Seller Agent issues retry prompt via Razorpay Payment Link fallback.
5. Secondary payment attempt succeeds → State updates to `PAID` with full audit trace of both failure and recovery.

### 3. Live Judges Dashboard

Open your browser to:
```
http://localhost:3000/demo
```
This dashboard streams real-time Server-Sent Events (SSE) showing live LLM reasoning, A2A negotiation payloads, inventory state transitions, and Razorpay webhook events as they happen.

---

## 📡 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check endpoint returning system status and DB connection. |
| `/api/catalog` | `GET` | Returns structured, agent-readable JSON catalog for connected stores. |
| `/api/a2a/negotiate` | `POST` | Agent-to-Agent negotiation endpoint for submitting structured offers. |
| `/api/checkout` | `POST` | Converts an agreed A2A deal into an x402 challenge & Razorpay Order. |
| `/api/webhook/razorpay` | `POST` | Validates HMAC-SHA256 signature and processes Razorpay payment events. |
| `/api/webhook/whatsapp` | `POST` | Inbound WhatsApp webhook; queues tasks to Redis worker. |
| `/demo` | `GET` | Live judge visual dashboard interface. |
| `/demo/stream` | `GET` | Server-Sent Events (SSE) feed for live transaction logs. |

---

## 📁 Project Directory Structure

```
Razorpay-Agent/
├── PRD.md                         # Product Requirements Document
├── ARCHITECTURE.md                # Detailed System & Microservice Architecture
├── README.md                      # Comprehensive Technical Readme
├── package.json                   # Dependencies and Bun scripts
├── tsconfig.json                  # TypeScript compiler settings
├── docker-compose.yml             # Local Redis service configuration
├── railway.toml                   # Deployment configuration for Railway
├── scripts/
│   ├── run-happy-path.ts          # E2E Happy Path test & demo script
│   └── run-failure-path.ts        # E2E Failure recovery test script
└── src/
    ├── index.ts                   # Main Express application entrypoint
    ├── agents/
    │   ├── buyer-agent.ts         # Buyer Agent LLM logic & AP2 spending mandate parser
    │   └── seller-agent.ts        # Seller Agent LLM logic & merchant guardrails evaluator
    ├── api/
    │   ├── a2a.ts                 # A2A negotiation HTTP endpoints
    │   ├── catalog.ts             # Agent catalog endpoints
    │   ├── checkout.ts            # x402 → Razorpay Order conversion engine
    │   ├── demo.ts                # SSE event broadcast endpoint & judge UI
    │   ├── razorpay-webhook.ts    # Razorpay webhook listener & HMAC validator
    │   └── whatsapp.ts            # WhatsApp webhook ingress
    ├── db/
    │   ├── schema.sql             # Postgres database schema definition
    │   ├── seed.sql               # Seed data for mock merchants & catalogs
    │   └── migrate.ts             # Migration and database boot script
    ├── services/
    │   ├── audit.ts               # 5-field linked audit ledger service
    │   ├── merchant.ts            # Postgres merchant data & inventory service
    │   ├── razorpay.ts            # Razorpay SDK initialization & order helpers
    │   ├── redis.ts               # Redis connection & atomic lock manager
    │   ├── whatsapp.ts            # Outbound WhatsApp Cloud API service
    │   └── x402.ts                # x402 challenge generator & verification
    ├── types/                     # TypeScript interface definitions
    └── workers/
        └── whatsapp-worker.ts     # Redis queue worker for async message processing
```

---

## 🛡 Failure Recovery & Resiliency

AgentBridge is architected for zero-downtime inventory integrity and fault-tolerant financial execution:

1. **UPI Timeout Handling:** If a UPI payment times out or drops, `payment.failed` immediately clears the Redis lock key (`lock:inventory:{store_id}:{variant_id}`), making stock available to other buyers in under 2 seconds.
2. **Idempotent Webhooks:** Razorpay webhooks are tracked in the `processed_webhook_events` table by event ID to guarantee exactly-once processing regardless of network retries.
3. **Webhook HMAC Validation:** Unauthenticated or improperly signed webhook requests are rejected with `401 Unauthorized` before reaching any service logic.
4. **Mandate Enforcement:** Even if an LLM generates a hallucinated high-value checkout command, the server-side payment engine validates the order total against the signed mandate spending limit before invoking Razorpay.

---

## 🏆 License & Acknowledgments

Developed specifically for the **Razorpay AI Buildathon 2026** under the **AI Growth & Agentic Commerce** track. Built with gratitude for the developer tools provided by **Razorpay**, **Google Cloud / AI Studio**, **Neon**, and **Railway**.
