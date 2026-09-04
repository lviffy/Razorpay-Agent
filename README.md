# ZapAI — AI-Native Agentic Commerce Middleware

> **Track:** Razorpay AI Buildathon 2026 — AI Growth & Agentic Commerce  
> **Status:** Production-Ready Submission  
> **Core Stack:** Bun • TypeScript • Next.js 15 • Express • Gemini 2.5 Flash • Razorpay Deep Suite • Neon Postgres • Redis • WhatsApp Cloud API • x402 Protocol  
> **Documentation:** [PRD.md](PRD.md) • [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Executive Summary

**ZapAI turns any e-commerce catalog or Shopify store into an AI-native commerce endpoint — where AI Buyer Agents discover, negotiate, reserve inventory, and settle transactions autonomously, with every rupee settled in INR through Razorpay's multi-product financial infrastructure.**

---

## Table of Contents

- [The Problem](#the-problem)
- [Solution Overview](#solution-overview)
- [System Architecture](#solution-overview)
- [Dual AI Agent System](#dual-ai-agent-system)
- [Razorpay Deep Financial Suite Integration](#razorpay-deep-financial-suite-integration)
- [8-Stage Tamper-Evident Audit Ledger](#8-stage-tamper-evident-audit-ledger)
- [Monorepo Architecture & Directory Structure](#monorepo-architecture--directory-structure)
- [Tech Stack & Infrastructure](#tech-stack--infrastructure)
- [Environment Variables](#environment-variables)
- [Quick Start & Local Setup](#quick-start--local-setup)
- [Test Suite & Automated Verification](#test-suite--automated-verification)
- [API Reference](#api-reference)
- [Failure Recovery & Resiliency](#failure-recovery--resiliency)
- [License & Acknowledgments](#license--acknowledgments)

---

## The Problem

It is 2:00 AM. A Buyer Agent is executing a task: *"Buy the best running shoes you can find under ₹4,000."* The consumer set their budget, pre-authorized a spending mandate, and went to sleep.

Here is what agentic commerce encounters on existing e-commerce systems:

1. **Unstructured Storefronts:** Storefronts are HTML rendered for human eyes. Product attributes are buried in unstructured text, and real-time inventory counts are inaccessible without custom integrations.
2. **Fixed Prices & No Negotiation Surface:** Prices are static. There is no machine-readable API endpoint to ask *"Will you accept ₹3,700 with free shipping for instant checkout?"*
3. **No Reservation Mechanism:** Even if the agent finds the right item, nothing prevents another buyer from purchasing it during the decision window.
4. **No Programmable Payment Path:** Traditional checkout requires human intervention (clicking links, entering OTPs). Agents cannot programmatically settle within a pre-authorized mandate and receive a cryptographic receipt.
5. **Settlement & Fiat Gap:** Global agent protocols like x402 are often tied to non-fiat tokens. Indian merchants require **instant bank settlement in INR** compliant with RBI banking regulations.

**ZapAI bridges all five failures in a single unified middleware layer.**

---

## Solution Overview

ZapAI operates as a three-layer intelligent middleware connecting e-commerce platforms to the agentic economy, backed by Razorpay as the financial and trust engine.

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
│                             ZAPAI GATEWAY & ROUTER                               │
│       • API Gateway (Express/Bun)        • HMAC Webhook Verification             │
│       • Conversation State Machine       • Dual-Agent Orchestration Engine       │
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
│   │   Razorpay Adapter     │   │  Postgres DB (Neon)    │   │ 8-Stage Audit   │  │
│   │   Deep Services Engine │   │  Catalog & Inventory   │   │ SHA-256 Ledger  │  │
│   └────────────────────────┘   └────────────────────────┘   └─────────────────┘  │
└───────────────────┬─────────────────────────────────────────────┬────────────────┘
                    │                                             │
                    ▼                                             ▼
┌──────────────────────────────────────┐     ┌─────────────────────────────────────┐
│          RAZORPAY FINANCIAL BUS      │     │           SHOPIFY MERCHANTS         │
│   • Orders & Payment Links           │     │   • Structured Catalog JSON         │
│   • Dynamic UPI QR & DeepLinks       │     │   • Real-Time Inventory Updates     │
│   • GST Tax Invoicing Engine         │     │   • Merchant Guardrail Rules        │
│   • UPI AutoPay & TokenHQ (RBI <15k) │     │   • Webhook Product Synchronization │
│   • Dynamic Offers Engine            │     │   • Order Write-Back                │
│   • Route Multi-Vendor Splits        │     │                                     │
│   • Instant Refunds & Disputes       │     │                                     │
└──────────────────────────────────────┘     └─────────────────────────────────────┘
```

### Layer 1 — Merchant Catalog & Inventory Engine
- Serves agent-readable structured JSON schemas (SKUs, listed price, floor price, live stock counts).
- Configurable merchant negotiation guardrails stored in Postgres (max discount %, free shipping threshold, bundle rules).
- State-machine driven inventory: `AVAILABLE → RESERVED → PAYMENT_PENDING → PAID/SOLD`.
- Atomic Redis TTL lock (`120s`) prevents race conditions and double-selling.

### Layer 2 — Dual AI Agent System (A2A Engine)
- **Seller Agent:** Operates per store. Evaluates incoming buyer requests against merchant guardrails, performs multi-turn counter-offers, and locks inventory atomically upon agreement.
- **Buyer Agent:** Acts on behalf of the consumer. Receives a natural-language mandate + pre-authorized spending limit, searches multiple store catalogs, conducts negotiations, and triggers payment when terms are met.
- **A2A Protocol:** Structured, signed HTTP exchange (`X-402-*` headers) ensuring auditable offer history.

### Layer 3 — Deep Payment & Settlement Stack (Razorpay Core)
- Converts x402 payment challenges directly into Razorpay Orders or Dynamic UPI QR Codes.
- Supports zero-touch tokenized debits via **UPI AutoPay** under RBI limits (≤ ₹15,000).
- Applies dynamic affiliate & bank discounts via **Razorpay Offers Engine** during negotiations.
- Deducts platform facilitator fees and distributes merchant payouts via **Razorpay Route**.
- Generates GST-compliant tax invoices with automatic CGST + SGST tax breakdown.

---

## Dual AI Agent System

ZapAI implements two specialized LLM agents built on **Autonomous AI Reasoning** with tool calling:

```
[Buyer Agent] ──── (1) Search & Request Offer ────► [Store A Seller Agent]
      │                                                     │
      ├────────── (2) Search & Request Offer ────► [Store B Seller Agent]
      │                                                     │
      ◄────────── (3) Counter-Offer (₹3,799) ──────────────┘ (Within 8% Discount Guardrail)
      │
[Verifies AP2 Spending Mandate: Max ₹4,000] [Verified]
      │
      └────────── (4) Accept & Request Payment Challenge ──► [Seller Agent]
                                                                  │
                                                     [Locks Inventory in Redis]
                                                                  │
                                                     [Issues x402 Challenge]
                                                                  │
                                                     [Generates Razorpay QR / Order / Link]
```

### 1. The Seller Agent (`apps/api/src/modules/agent/`)
- Configured per merchant with business rules:
  - *Max discount percentage* (e.g., up to 10% off for orders above ₹2,000).
  - *Free shipping threshold* (e.g., free shipping on orders above ₹3,000).
  - *Floor price protection* (strictly blocks offers below item cost).
- Performs atomic inventory locks (`Redis SET NX EX 120`) when an offer is accepted.

### 2. The Buyer Agent (`apps/api/src/modules/agent/`)
- Bounded by an **AP2 Spending Mandate**:
  ```json
  {
    "mandateId": "man_982347102938",
    "spendingLimit": 400000,
    "currency": "INR",
    "purpose": "Buy running shoes",
    "expiresAt": "2026-09-05T00:00:00Z"
  }
  ```
- Evaluates multiple merchants simultaneously and automatically selects the optimal deal within budget.
- Enforces strict spending checks both at the LLM tool boundary and at the server gateway.

---

## Razorpay Deep Financial Suite Integration

ZapAI implements a comprehensive adapter across **8 distinct Razorpay API capabilities**:

| Razorpay Module | File / Location | Purpose & Implementation |
|---|---|---|
| **Orders API** | [`orders.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/orders.ts) | Idempotent order creation for agent payments, anchoring the immutable 8-stage audit trail. |
| **Payment Links API** | [`payment-links.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/payment-links.ts) | Generates instant interactive payment links with customer contact prefill for human-in-the-loop fallback. |
| **Dynamic UPI QR Codes** | [`qr.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/qr.ts) | Generates dynamic single-use UPI QR codes + RFC-compliant UPI DeepLinks (`upi://pay?...`) for 1-tap mobile checkout. |
| **GST Tax Invoices** | [`invoices.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/invoices.ts) | Programmatically creates GST-compliant tax invoices with automated CGST (9%) + SGST (9%) breakdown, HSN coding, and PDF download links. |
| **UPI AutoPay & Mandates** | [`autopay.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/autopay.ts) | Customer token registration and zero-touch autonomous debits compliant with the RBI ₹15,000 threshold exemption. |
| **Dynamic Offers Engine** | [`offers.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/offers.ts) | Real-time discount optimization (e.g. HDFC 10%, UPI AutoPay flat ₹200) injected directly into AI agent counter-offer reasoning. |
| **Route (Split Settlements)** | [`route.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/route.ts) | Multi-vendor cart settlement with automated platform commission take-rate deduction and linked merchant payouts. |
| **Instant Refunds** | [`refunds.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/refunds.ts) | Automated programmatic refund issuance with structured dispute reasoning (`inventory_unavailable`, `price_mismatch`). |
| **Dispute Evidence Adapter** | [`disputes.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/disputes.ts) | Compiles the cryptographic SHA-256 hash-chained audit ledger into a proof bundle and submits it to Razorpay Dispute Evidence API. |
| **Webhook HMAC Verification** | [`webhooks.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/webhooks.ts) | Constant-time HMAC-SHA256 signature verification preventing webhook spoofing or replay attacks. |

---

## 8-Stage Tamper-Evident Audit Ledger

Every transaction processed through ZapAI generates a deterministic, tamper-evident cryptographic hash chain across an 8-stage lifecycle, protected by **RFC 8785 Canonical JSON hashing**, **PostgreSQL concurrency locking**, and **Ed25519 Signed Checkpoints**:

$$H_n = \text{SHA256}(H_{n-1} : \text{eventType} : \text{actor} : \text{payloadHash} : \text{timestamp})$$

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 8-STAGE CRYPTOGRAPHIC HASH CHAIN & TRUST ANCHOR                                                        │
│                                                                                                        │
│  [#1 INTENT] ──► [#2 MANDATE] ──► [#3 DEAL] ──► [#4 INVENTORY] ──► [#5 X402-REQ] ──► [#6 X402-AUTH]    │
│      │                │               │                │                 │                 │           │
│   a81f...          b19a...         c20b...          d31c...           e42d...           f53e...        │
│                                                                                                        │
│                           ──► [#7 RZP-CAPTURE] ──► [#8 ORDER-COMMIT] ──► [SIGNED CHECKPOINT]          │
│                                      │                     │                      │                    │
│                                   064f...               1750...            Ed25519 Anchor              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5-Way Linked Cross-System Identifiers
Any entity (merchant, buyer, auditor, or regulator) can query any of the 5 cross-referenced keys:

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

---

## Monorepo Architecture & Directory Structure

```
Razorpay-Agent/
├── apps/
│   ├── api/                               # Express + Bun API Gateway
│   │   ├── src/
│   │   │   ├── index.ts                   # Main server bootstrap
│   │   │   ├── audit/                     # SHA-256 Hash Chain & RFC 8785 Canonicalizer
│   │   │   ├── commerce/                  # Offer evaluation & pricing engine
│   │   │   ├── integrations/
│   │   │   │   ├── razorpay/              # Razorpay client & webhook verifier
│   │   │   │   ├── shopify/               # Shopify OAuth & webhook HMAC sync
│   │   │   │   └── whatsapp/              # Meta Cloud API message sender
│   │   │   ├── modules/
│   │   │   │   ├── agent/                 # LangChain / Gemini AI reasoning engine
│   │   │   │   ├── analytics/             # Revenue, GMV, & conversion metrics
│   │   │   │   ├── onboarding/            # Store onboarding & API key provisioning
│   │   │   │   ├── orders/                # Order lifecycle & settlement tracker
│   │   │   │   ├── products/              # Product catalog & CSV bulk import
│   │   │   │   ├── settings/              # Store rules & credential management
│   │   │   │   └── simulator/             # Interactive web A2A chat simulation
│   │   │   └── payments/
│   │   │       └── razorpay/              # Deep Razorpay capabilities:
│   │   │           ├── adapter.ts         # Unified PaymentService adapter
│   │   │           ├── autopay.ts         # UPI AutoPay & RBI limit enforcement
│   │   │           ├── disputes.ts        # Audit proof compiler for disputes
│   │   │           ├── invoices.ts        # GST tax invoice calculation & PDF
│   │   │           ├── offers.ts          # Bank/UPI offer optimization
│   │   │           ├── orders.ts          # Order creation
│   │   │           ├── payment-links.ts   # Interactive human approval links
│   │   │           ├── qr.ts              # Dynamic UPI QR & DeepLinks
│   │   │           ├── refunds.ts         # Instant programmatic refunds
│   │   │           ├── route.ts           # Multi-merchant split settlements
│   │   │           └── webhooks.ts        # HMAC signature verification
│   │   └── package.json
│   │
│   └── web/                               # Next.js 15 App Router Frontend
│       ├── app/
│       │   ├── dashboard/                 # Analytics, catalog, orders, audit explorer, settings
│       │   ├── onboarding/                # Step-by-step merchant onboarding wizard
│       │   └── layout.tsx                 # Root layout & providers
│       ├── components/                    # Radix UI, dashboard panels, topbar, charts
│       └── package.json
│
├── packages/
│   ├── database/                          # Neon Postgres Client, Migrations & Schema
│   │   ├── src/
│   │   │   ├── schema.sql                 # Complete Postgres database schema
│   │   │   ├── seed.sql                   # Database seed template
│   │   │   ├── migrate.ts                 # Database migration runner
│   │   │   └── index.ts                   # Postgres pool connection
│   │   └── package.json
│   │
│   └── types/                             # Shared TypeScript definitions
│       └── src/
│           └── index.ts                   # Product, Store, Rules, A2A, Audit types
│
├── tests/                                 # Bun Automated Test Suites (43 Passing Tests)
│   ├── agentic-commerce-modules.test.ts   # Mandate guards, x402 V2, hash chain
│   ├── conversation-intelligence.test.ts  # 13 Conversational AI scenarios
│   ├── razorpay-advanced.test.ts          # Invoices, QR, AutoPay, Offers
│   ├── razorpay-advanced-services.test.ts # Deep Razorpay adapter tests
│   └── shopify-integration.test.ts        # Shopify webhooks & HMAC verification
│
├── package.json                           # Turborepo root configuration
├── turbo.json                             # Turborepo task pipeline
└── tsconfig.json                          # Base TypeScript configuration
```

---

## Tech Stack & Infrastructure

- **Runtime:** [Bun](https://bun.sh/) (v1.4+) — ultra-fast TypeScript engine with built-in test runner.
- **Monorepo Manager:** [Turborepo](https://turbo.build/) — cached builds and parallel pipeline execution.
- **Frontend App:** [Next.js 15](https://nextjs.org/) (App Router), React 19, TailwindCSS, Radix UI, Framer Motion.
- **Backend API:** [Express](https://expressjs.com/) with TypeScript strict mode on Bun runtime.
- **AI / LLM Engine:** [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/generative-ai` with structured tool calling.
- **Database:** [Neon Serverless Postgres](https://neon.tech/) with connection pooling.
- **Caching & Lock Engine:** [Redis 7](https://redis.io/) (`ioredis`) with atomic Redlock pattern (`SET NX EX`).
- **Payment Infrastructure:** Official `razorpay` Node SDK.
- **Messaging Interface:** WhatsApp Business Cloud API.
- **Protocol:** Fiat-Native HTTP 402 (`x402`).

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

| Variable | Description | Example / Required Format |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio API Key | `AIzaSy...` |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Key Secret | `xxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks | `xxxxxxxxxxxxxxxx` |
| `DATABASE_URL` | Neon Postgres pooled connection string | `postgresql://user:pass@ep-xxx.neon.tech/zapai?sslmode=require` |
| `REDIS_URL` | Redis instance connection string | `redis://localhost:6379` |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Phone Number ID | `1006...` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API Permanent Token | `EAAG...` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Verification token for Meta webhook | `random_verify_token` |
| `APP_URL` | Frontend URL | `http://localhost:3000` |
| `PORT` | API Server port | `8000` |

---

## Quick Start & Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/lviffy/Razorpay-Agent.git
cd Razorpay-Agent
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, RAZORPAY_KEY_ID, DATABASE_URL, etc.
```

### 3. Run Database Migrations

```bash
bun run migrate
```

### 4. Start Development Servers

```bash
# Starts both Next.js Web Dashboard (Port 3000) and API Gateway (Port 8000) in parallel:
bun run dev
```

- **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:8000](http://localhost:8000)
- **API Health Check:** `curl http://localhost:8000/health`

---

## Test Suite & Automated Verification

ZapAI includes comprehensive end-to-end automated unit, integration, and intelligence tests:

```bash
bun test
```

### Test Suites Included:
1. **`tests/razorpay-advanced.test.ts`**: Verifies dynamic GST tax invoice calculation, Dynamic UPI QR code generation, Razorpay offers discount evaluation, and recurring AutoPay subscription plans.
2. **`tests/razorpay-advanced-services.test.ts`**: Verifies UPI AutoPay token registration, RBI ₹15,000 threshold safety limits, Razorpay Route multi-vendor split distribution, Instant Refunds, and Cryptographic Dispute Evidence compilation.
3. **`tests/agentic-commerce-modules.test.ts`**: Verifies cryptographic AP2 spending mandates, zero-trust server validation, nonce replay attack prevention, and x402 challenge-response settlement.
4. **`tests/conversation-intelligence.test.ts`**: Evaluates 13 distinct multi-turn conversational commerce scenarios (e.g. price negotiation, quantity adjustments, floor price constraints, catalog switching).
5. **`tests/shopify-integration.test.ts`**: Tests domain normalization, Shopify webhook HMAC SHA-256 signature verification, and graceful unauthenticated store handling.

**Current Test Status:** `43 passing tests` across 5 suites (0 failures).

---

## API Reference

### Core Backend Routes (`apps/api/src/`)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check endpoint returning database connectivity and server uptime. |
| `/api/chat` | `POST` | AI conversational commerce endpoint with streaming reasoning and tool execution. |
| `/api/products` | `GET`, `POST`, `PUT` | Product catalog retrieval, bulk upload, CSV parsing, and Shopify sync. |
| `/api/onboarding` | `POST` | Merchant onboarding, store creation, and credentials validation. |
| `/api/orders` | `GET` | Order lifecycle, status tracking, and payment link lookup. |
| `/api/settings` | `GET`, `POST` | Store negotiation rules, discount thresholds, and Razorpay/Shopify credentials. |
| `/api/analytics` | `GET` | GMV, total orders, discount protection metrics, and channel distribution. |
| `/api/webhooks/razorpay` | `POST` | Validates HMAC-SHA256 signature and processes payment capture/failure webhooks. |
| `/api/webhooks/shopify` | `POST` | Synchronizes Shopify catalog and order changes via webhook HMAC. |
| `/api/simulator/chat` | `POST` | Interactive A2A commerce simulator for testing agent negotiations. |

---

## Failure Recovery & Resiliency

1. **UPI & Payment Timeout Handling:** When a payment fails or times out, the Redis inventory lock (`lock:inventory:{store_id}:{variant_id}`) is released immediately (<2s), making inventory available for other shoppers.
2. **Idempotent Webhooks:** Razorpay webhooks are tracked by unique event ID in `processed_webhook_events` to ensure strict exactly-once execution.
3. **Zero-Trust Mandate Boundary:** Server-side payment settlement strictly validates payment amount against the cryptographically signed buyer mandate limit before communicating with Razorpay.
4. **Network Fallback Safety:** All Razorpay API integrations include resilient timeouts and fallbacks to ensure uninterrupted operation during network fluctuations.

---

## License & Acknowledgments

Developed for the **Razorpay AI Buildathon 2026** under the **AI Growth & Agentic Commerce** track. Built with gratitude for the developer tools and APIs provided by **Razorpay**, **Google Cloud / AI Studio**, **Neon**, and **Bun**.
