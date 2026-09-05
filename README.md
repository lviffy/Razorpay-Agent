# ZapAI — Autonomous AI-Native Commerce Middleware

<div align="center">

### AI Agents that Discover, Negotiate, and Buy on WhatsApp & Web with Real-Time INR Settlement via Razorpay

[![Live Web Application](https://img.shields.io/badge/Live%20Platform-zapai--com.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://zapai-com.vercel.app/)
[![YouTube Video Walkthrough](https://img.shields.io/badge/Demo%20Video-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/pyoltM28Mhg)
[![Buildathon Track](https://img.shields.io/badge/Track-AI%20Growth%20%26%20Agentic%20Commerce-7c3aed?style=for-the-badge)](https://razorpay.com)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%205.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

<br />

<a href="https://zapai-com.vercel.app/">
  <img src="./website.png" alt="ZapAI — Autonomous AI-Native Commerce Platform" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
</a>

<br /><br />

</div>

---

## ⚡ Quick Links & Live Demonstrations

| Resource | Link | Description |
|---|---|---|
| 🌐 **Live Web Application** | [zapai-com.vercel.app](https://zapai-com.vercel.app/) | Production Next.js 15 merchant dashboard, catalog manager, live simulator, & AI Growth Advisor. |
| 🎥 **YouTube Video Walkthrough** | [youtu.be/pyoltM28Mhg](https://youtu.be/pyoltM28Mhg) | Full submission walkthrough showing seller onboarding, WhatsApp live negotiation, and Razorpay UPI capture. |
| 📄 **Product Requirements (PRD)** | [`PRD.md`](PRD.md) | Comprehensive product specifications, user journeys, edge cases, and business goals. |
| 📐 **System Architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Low-level distributed system design, protocol specifications, database schemas, and cryptographic proofs. |


---

## Executive Summary

**ZapAI turns any e-commerce catalog or Shopify store into an AI-native commerce endpoint.** 

In today's e-commerce landscape, buyers search, compare, hunt for discount codes, and abandon carts because the checkout experience is fundamentally disconnected from the conversation. Current AI shopping assistants merely regurgitate recommendations and paste static links.

**Commerce has always been conversational.** ZapAI brings true agency to both sides of the transaction:
- **AI Seller Agents** live directly on WhatsApp and the web, equipped with deep knowledge of merchant inventory, profit margins, and strict negotiation guardrails.
- **AI Buyer Agents** act autonomously on behalf of consumers, discovering items across multiple stores, evaluating terms, and negotiating discounts within a cryptographically signed **AP2 spending mandate**.
- **Razorpay** provides the comprehensive financial infrastructure — executing dynamic UPI QR codes, 1-tap Payment Links, programmatic Offer discount stacking, tokenized UPI AutoPay mandates under RBI limits (≤ ₹15,000), split route payouts, and GST-compliant tax invoicing.
- **x402 Protocol Bridge** maps global HTTP 402 machine-to-machine payment challenges directly to instant Indian Rupee (INR) bank settlement.
- **8-Stage Cryptographic Audit Ledger** records every state transition from raw intent to payment capture into an RFC 8785 canonicalized, SHA-256 tamper-evident hash chain with Ed25519 signed checkpoints.

---

## Table of Contents

- [⚡ Quick Links & Live Demonstrations](#-quick-links--live-demonstrations)
- [Executive Summary](#executive-summary)
- [The Problem We Solve](#the-problem-we-solve)
- [System Architecture & Flow](#system-architecture--flow)
- [Dual-AI Agent Negotiation Engine](#dual-ai-agent-negotiation-engine)
- [Deep Razorpay Financial Suite](#deep-razorpay-financial-suite)
- [8-Stage Tamper-Evident Audit Ledger](#8-stage-tamper-evident-audit-ledger)
- [Comprehensive Tech Stack](#comprehensive-tech-stack)
- [Monorepo & Codebase Directory Structure](#monorepo--codebase-directory-structure)
- [Merchant Dashboard & AI Growth Advisor](#merchant-dashboard--ai-growth-advisor)
- [Environment Variables](#environment-variables)
- [Quick Start & Local Development](#quick-start--local-development)
- [Automated Test Suite (43 Tests Passing)](#automated-test-suite-43-tests-passing)
- [API Reference](#api-reference)
- [Resiliency & Security Architecture](#resiliency--security-architecture)
- [License & Acknowledgments](#license--acknowledgments)

---

## The Problem We Solve

Imagine it is 2:00 AM. A consumer delegates an instruction to their AI Buyer Agent:  
*"Find Nike Pegasus 40 UK 9 under ₹4,000. Negotiate the best deal, reserve stock, and complete checkout."*

On existing e-commerce systems, this workflow fails completely across five critical dimensions:

```
❌ Traditional E-Commerce Bottlenecks
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│  Unstructured Catalogs  │  │  Rigid, Static Prices   │  │   No Stock Reservation  │
│  HTML built for eyes;   │  │  Zero programmatic      │  │  Items sell out during  │
│  no structured queries. │  │  negotiation surface.   │  │  agent decision window. │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐
│   Manual Human Checkout │  │  Fiat & Settlement Gap  │
│  OTPs & clicks required │  │  Global agent protocols │
│  break autonomous flow. │  │  ignore RBI/INR rails.  │
└─────────────────────────┘  └─────────────────────────┘
```

1. **Unstructured Storefronts:** Storefronts are styled HTML intended for manual browsing. Inventory levels and variant attributes are trapped behind opaque frontends.
2. **Fixed Prices with Zero Negotiation Surface:** E-commerce prices are rigid. There is no API interface for an agent to propose: *"Will you accept ₹3,799 with free express shipping for instant checkout?"*
3. **Absence of Atomic Inventory Locks:** During multi-agent price evaluations, inventory frequently sells out, leading to broken autonomous orders.
4. **Friction-Heavy Checkout Walls:** Current checkouts demand human link clicking, form fills, and manual OTP entries.
5. **The Agentic Fiat Settlement Gap:** Emerging agent protocols (such as raw crypto x402) fail Indian retail reality: Indian merchants require **strict INR bank settlement** fully compliant with RBI banking regulations.

**ZapAI unifies all five pillars into a production-ready middleware layer.**

---

## System Architecture & Flow

ZapAI connects the buyer ecosystem directly to merchant stores through an intelligent gateway powered by Gemini 2.5 Flash, Redis distributed locking, and Razorpay financial rails.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BUYER ECOSYSTEM                                     │
│   ┌──────────────────────────┐  ┌──────────────────────────┐  ┌────────────────────┐   │
│   │  Autonomous Buyer Agent  │  │   Consumer on WhatsApp   │  │  Procurement Bot   │   │
│   │  (AP2 Mandate Protected) │  │   (Meta Cloud API)       │  │  (B2B Multi-Cart)  │   │
│   └────────────┬─────────────┘  └────────────┬─────────────┘  └──────────┬─────────┘   │
└────────────────┼─────────────────────────────┼───────────────────────────┼─────────────┘
                 │                             │                           │
                 ▼ (x402 Fiat HTTP)            ▼ (WhatsApp Cloud Webhook)  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ZAPAI GATEWAY & ROUTER                                    │
│   • Express / Bun API Gateway (Port 8000)      • HMAC-SHA256 Signature Verification   │
│   • Multi-Turn Conversation State Machine      • Gemini 2.5 Flash Tool Reasoning Engine│
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼─────────────────────────────────────────────┐
│                             CORE DISTRIBUTED SERVICES                                  │
│                                                                                        │
│   ┌─────────────────────────┐   ┌─────────────────────────┐   ┌────────────────────┐   │
│   │   Seller Agent Engine   │   │   Buyer Agent Engine    │   │  Redis Redlock     │   │
│   │   Merchant Rules Engine │   │   AP2 Spending Guard    │   │  120s Lock Engine  │   │
│   └────────────┬────────────┘   └────────────┬────────────┘   └──────────┬─────────┘   │
│                │                             │                           │             │
│   ┌────────────▼────────────┐   ┌────────────▼────────────┐   ┌──────────▼─────────┐   │
│   │   Razorpay Deep Suite   │   │  Neon Serverless PG     │   │  8-Stage Cryptographic││
│   │   Unified Financial Bus │   │  Catalog & Concurrency  │   │  SHA-256 Audit     │   │
│   └─────────────────────────┘   └─────────────────────────┘   └────────────────────┘   │
└──────────────────────┬───────────────────────────────────────────────────┬─────────────┘
                       │                                                   │
                       ▼                                                   ▼
┌───────────────────────────────────────────────┐   ┌────────────────────────────────────┐
│            RAZORPAY FINANCIAL RAILS           │   │         CONNECTED MERCHANTS        │
│  • Orders API (Idempotent Audit Anchors)      │   │  • Shopify Admin GraphQL / REST    │
│  • Dynamic UPI QR & RFC UPI DeepLinks         │   │  • Webhook HMAC SHA-256 Real-Time  │
│  • 1-Tap WhatsApp Payment Links               │   │  • CSV Bulk Catalog Ingestion      │
│  • Automated GST Tax Invoicing (CGST/SGST)    │   │  • Profit Margin Floor Guardrails  │
│  • UPI AutoPay & TokenHQ (RBI <₹15,000)       │   │  • Automatic Inventory Sync        │
│  • Dynamic Bank & UPI Offers Engine           │   │  • Order Write-Back                │
│  • Route Multi-Vendor Split Settlements       │   │                                    │
│  • Instant Refund & Dispute Evidence Bundle   │   │                                    │
└───────────────────────────────────────────────┘   └────────────────────────────────────┘
```

---

## Dual-AI Agent Negotiation Engine

ZapAI features two specialized agents operating with structured tool execution:

```
[Consumer / Buyer Agent]                                   [ZapAI Seller Agent]
           │                                                         │
           ├─── (1) "Find Nike Pegasus 40 UK 9, best price" ────────►│
           │                                                         ├── Validates Catalog & Stock
           │                                                         ├── Evaluates Margin Floor Guardrail
           │◄── (2) "Listed at ₹4,299. I can do ₹3,799 with ─────────┤
           │         Free Express Shipping (Deal of the day)!"       │
           │                                                         │
     [AP2 Mandate Check]                                             │
   (Budget ₹4,000: PASS)                                             │
           │                                                         │
           ├─── (3) Accept Offer & Request Payment Challenge ───────►│
           │                                                         ├── Acquires Redis SET NX EX 120 Lock
           │                                                         ├── Generates Razorpay Order & Links
           │◄── (4) x402 Challenge Issued: ──────────────────────────┤
           │        • 1-Tap UPI Intent Link (`upi://pay?...`)        │
           │        • Dynamic Razorpay Payment Link / QR Code        │
           │                                                         │
    [Payment Completed] ─────────────────────────────────────────────┘
           │
           ▼
[Razorpay Webhook Verified] ──► [Commit Order] ──► [Append SHA-256 Ledger] ──► [Release Redis Lock]
```

### 1. The Seller Agent (`apps/api/src/modules/agent/`)
- Operates on behalf of each individual merchant store.
- Enforces strict **business guardrails** configured in the dashboard:
  - **Hard Floor Price Protection:** Absolutely blocks counter-offers below product unit cost + baseline margin.
  - **Dynamic Concession Curve:** Anchors high on turn 1, calculates multi-round counter-offers, and drips incremental concessions across turns without breaching margins.
  - **Volume & Bundle Discounts:** Automatically rewards multi-unit or cross-category purchases.
  - **Free Shipping Thresholds:** Integrates shipping waiver logic based on total cart value.
- Acquires an atomic **120-second Redis lock** (`SET NX EX 120`) immediately upon deal agreement to guarantee stock reservation.

### 2. The Buyer Agent (`apps/api/src/modules/agent/`)
- Represents the consumer across multiple merchant stores simultaneously.
- Governed by an **AP2 (Agent Payment Protocol) Spending Mandate**:
  ```json
  {
    "mandateId": "man_982347102938",
    "buyerId": "usr_buyer_449102",
    "spendingLimit": 400000,
    "currency": "INR",
    "purpose": "Buy running shoes Nike Pegasus 40 UK 9",
    "expiresAt": "2026-09-06T00:00:00Z",
    "signature": "3045022100e4b8..."
  }
  ```
- Evaluates competing offers, verifies mandate bounds prior to initiating settlement, and executes zero-touch debits or presents 1-tap UPI links.

---

## Deep Razorpay Financial Suite

ZapAI implements a comprehensive production adapter across **10 distinct Razorpay API capabilities**:

| Razorpay Module | Source Code Reference | Technical Implementation & Capability |
|---|---|---|
| **Orders API** | [`orders.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/orders.ts) | Idempotent order creation tying cart items, buyer mandate, and currency (`INR`) into an immutable financial record. |
| **Payment Links API** | [`payment-links.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/payment-links.ts) | Generates interactive 1-tap payment links prefilled with customer contact info for human-in-the-loop WhatsApp checkout. |
| **Dynamic UPI QR & DeepLinks** | [`qr.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/qr.ts) | On-demand single-use dynamic UPI QR codes and RFC-compliant `upi://pay?...` deep-links for seamless 1-tap mobile payment. |
| **GST Tax Invoices API** | [`invoices.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/invoices.ts) | Automated GST-compliant tax invoicing with automated CGST (9%) + SGST (9%) calculation, HSN code tagging, and downloadable customer invoice links. |
| **UPI AutoPay & TokenHQ** | [`autopay.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/autopay.ts) | Customer token registration and recurring mandate debits under RBI's ₹15,000 threshold exemption for true autonomous execution. |
| **Dynamic Offers Engine** | [`offers.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/offers.ts) | Programmatic bank and UPI discount optimization (e.g., HDFC 10%, UPI AutoPay flat ₹200) factored directly into AI agent counter-offer calculations. |
| **Route (Split Settlements)** | [`route.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/route.ts) | Multi-vendor marketplace split payouts with automated platform commission take-rate deduction and linked merchant payouts. |
| **Instant Refunds API** | [`refunds.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/refunds.ts) | Automated programmatic refund processing with structured reason codes (`inventory_unavailable`, `price_mismatch`). |
| **Dispute Evidence Adapter** | [`disputes.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/disputes.ts) | Compiles the cryptographic SHA-256 audit ledger into an RFC 8785 evidence bundle and submits it directly to Razorpay's Dispute Evidence API. |
| **Webhook HMAC Verification** | [`webhooks.ts`](file:///home/lviffy/Projects/Razorpay-Agent/apps/api/src/payments/razorpay/webhooks.ts) | Constant-time `crypto.timingSafeEqual` HMAC-SHA256 signature verification preventing webhook spoofing or replay attacks. |

---

## 8-Stage Tamper-Evident Audit Ledger

Every transaction processed through ZapAI generates a deterministic, tamper-evident cryptographic hash chain across an 8-stage lifecycle, protected by **RFC 8785 Canonical JSON hashing**, **PostgreSQL concurrency locking**, and **Ed25519 Signed Checkpoints**:

$$H_n = \text{SHA256}(H_{n-1} \mathbin{\Vert} \text{eventType} \mathbin{\Vert} \text{actor} \mathbin{\Vert} \text{canonicalPayloadHash} \mathbin{\Vert} \text{timestamp})$$

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               8-STAGE CRYPTOGRAPHIC HASH CHAIN AUDIT TRAIL                             │
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
Any entity (merchant, buyer, auditor, or regulator) can instantly verify or reconstruct the audit chain using any of the 5 cross-referenced keys:

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
│         Internal Order ID         │
│             ORD-1042              │
└───────────────────────────────────┘
```

---

## Comprehensive Tech Stack

ZapAI is built with a state-of-the-art TypeScript monorepo architecture leveraging modern runtimes, serverless databases, robust AI SDKs, and deep payment integrations:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 TECH STACK OVERVIEW                              │
│                                                                                  │
│  FRONTEND (Next.js 15)       BACKEND API (Bun + Express)   DATABASE & CACHE      │
│  • Next.js 15.1 (App Router) • Bun 1.4+ Runtime            • Neon Serverless PG  │
│  • React 19                  • Express 4.21 TypeScript     • Redis 7 (ioredis)   │
│  • TailwindCSS 3.4           • Google Gemini 2.5 Flash     • pg Connection Pool  │
│  • Radix UI Primitives (20+) • Groq SDK (Ultra-Low Latency)• Atomic Redlock      │
│  • Framer Motion 12          • Zod 3.24 & Pino 9 Logging                         │
│  • Recharts 3.10             • Bcrypt.js & JWT Security                          │
│                                                                                  │
│  FINANCIAL RAILS             MESSAGING & PROTOCOLS         TOOLING & DEVOPS      │
│  • Razorpay Node SDK 2.9.6   • WhatsApp Cloud API          • Turborepo 2.4       │
│  • Dynamic UPI QR & DeepLink • x402 HTTP Payment Protocol  • Bun Test Runner     │
│  • UPI AutoPay Mandates      • AP2 Spending Mandates       • Docker Compose      │
│  • GST Tax Invoicing         • RFC 8785 Canonical JSON     • Vercel & Railway    │
│  • Razorpay Route & Offers   • Ed25519 Signed Checkpoints  • ESLint & TypeScript │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Frontend Web Application (`apps/web`)
- **Framework:** [Next.js 15.1](https://nextjs.org/) with App Router, React Server Components (RSC), dynamic metadata, and API routes.
- **UI Library:** [React 19](https://react.dev/) with concurrent features and server actions.
- **Language:** [TypeScript 5.7](https://www.typescriptlang.org/) with strict type safety.
- **Styling:** [TailwindCSS 3.4](https://tailwindcss.com/) with custom design tokens, CSS variables, and seamless dark mode via `next-themes`.
- **Component Primitives:** [Radix UI](https://www.radix-ui.com/) (over 20 accessible headless primitives: Dialog, DropdownMenu, Accordion, Tooltip, Popover, Slider, Tabs, Toast, Switch, Select, etc.).
- **Motion & Micro-interactions:** [Framer Motion 12](https://www.framer.com/motion/) and `motion` 13 for smooth layout transitions, fluid spring animations, and responsive interactive elements.
- **Data Visualization:** [Recharts 3.10](https://recharts.org/) for live GMV trendlines, conversion rate funnels, and discount protection graphs.
- **Notification & Overlays:** [Sonner](https://sonner.emilkowal.ski/) toast system and [Vaul](https://vaul.emilkowal.ski/) drawer sheet component.
- **Command Menu:** [CMDK](https://cmdk.paco.me/) command palette for lightning-fast keyboard-first navigation.
- **Carousels:** [Embla Carousel](https://www.embla-carousel.com/) for touch-friendly product and testimonial carousels.
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) combined with [Zod](https://zod.dev/) client-side validation.
- **Icons:** [Phosphor Icons React](https://phosphoricons.com/) and [Lucide React](https://lucide.dev/).
- **Deployment:** [Vercel](https://vercel.com/) edge hosting at [https://zapai-com.vercel.app/](https://zapai-com.vercel.app/).

### 2. Backend API Gateway & Orchestration (`apps/api`)
- **Runtime:** [Bun 1.4+](https://bun.sh/) — high-performance JavaScript/TypeScript runtime with native TypeScript execution and native testing.
- **Server Framework:** [Express 4.21](https://expressjs.com/) with modular routing, CORS, and JSON body parsing.
- **AI / LLM Orchestration:**
  - [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/generative-ai` with structured JSON schema outputs and function calling.
  - [Groq SDK](https://groq.com/) (`groq-sdk`) for ultra-low latency fallback LLM inference (<200ms).
  - Google Auth Library for secure enterprise service access.
- **Validation:** [Zod 3.24](https://zod.dev/) for strict runtime request payload sanitization and boundary checking.
- **Logging & Monitoring:** [Pino 9](https://getpino.io/) and `pino-pretty` for high-throughput structured JSON telemetry.
- **Security & Authentication:** [JSONWebToken (JWT)](https://jwt.io/) and [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) for merchant authorization and session management.
- **Network Clients:** [Axios](https://axios-http.com/) for outbound HTTP API communication.

### 3. Financial Infrastructure & Payment Rails (Razorpay Deep Suite)
- **SDK:** Official [Razorpay Node SDK](https://razorpay.com/docs/api/) (`razorpay` 2.9.6).
- **Core Razorpay APIs Leveraged:**
  1. *Orders API* — Idempotent order initialization with currency validation.
  2. *Payment Links API* — Dynamic, interactive checkout links prefilled with customer context.
  3. *Dynamic UPI QR Codes* — On-demand single-use UPI QR generation and RFC-compliant `upi://pay?...` deep-links.
  4. *Invoices API* — Programmatic GST-compliant tax invoices with automatic CGST (9%) + SGST (9%) calculations and downloadable customer PDFs.
  5. *UPI AutoPay & TokenHQ* — Recurring mandate registration and zero-touch autonomous debits compliant with RBI ₹15,000 threshold exemption.
  6. *Dynamic Offers Engine* — Real-time bank/UPI offer optimization (e.g. HDFC 10%, UPI AutoPay flat ₹200) injected directly into agent negotiation reasoning.
  7. *Route* — Multi-vendor marketplace split settlements with automated platform fee take-rate deduction and linked merchant payouts.
  8. *Instant Refunds API* — Programmatic dispute-based automated refund issuance.
  9. *Dispute Evidence Adapter* — Compiles cryptographic SHA-256 audit ledger into an RFC 8785 evidence bundle for Razorpay dispute resolution.
  10. *Webhook Signature Verifier* — Constant-time HMAC-SHA256 signature verification.

### 4. Database, Caching & Distributed Locks (`packages/database`)
- **Primary Database:** [Neon Serverless PostgreSQL](https://neon.tech/) with pooled connections via `pg` (8.13) and robust relational schemas.
- **In-Memory Cache & Distributed Lock:** [Redis 7](https://redis.io/) (`ioredis` 5.4) implementing atomic Redlock patterns (`SET NX EX 120`) to guarantee inventory locks during active negotiations.
- **Concurrency Control:** Row-level PostgreSQL locks (`SELECT ... FOR UPDATE`) preventing race conditions during ledger block creation.

### 5. Messaging & Open Protocols
- **Meta WhatsApp Cloud API:** Bi-directional real-time messaging via Graph API, handling incoming customer inquiries, catalog browsing, and interactive checkout links.
- **x402 Protocol:** Fiat-native HTTP 402 Payment Required challenge-response protocol bridging machine-to-machine payments to Indian Rupee (INR) bank rails.
- **AP2 Mandate Protocol:** Cryptographically bounded agent spending mandates enforcing strict budget limits and purpose constraints.

### 6. Cryptography & Security
- **RFC 8785 Canonical JSON:** Deterministic, whitespace-insensitive JSON canonicalization ensuring tamper-evident hash chain reproducibility across distributed nodes.
- **SHA-256 Hash Chaining:** Forward-linked cryptographic ledger securing each transaction stage.
- **Ed25519 Digital Signatures:** Asymmetric digital signing of audit checkpoints.
- **Timing-Safe HMAC:** Constant-time `crypto.timingSafeEqual` verification for Razorpay and Shopify webhook signatures.

### 7. Monorepo & Build Tooling
- **Monorepo Manager:** [Turborepo 2.4](https://turbo.build/) for pipeline execution and cached builds.
- **Package Management:** [Bun Workspaces](https://bun.sh/docs/install/workspaces) linking `@zapai/web`, `@zapai/api`, `@zapai/database`, and `@zapai/types`.
- **Containers:** Docker multi-stage builds (`Dockerfile`) and `docker-compose.yml`.

---

## Monorepo & Codebase Directory Structure

```
Razorpay-Agent/
├── apps/
│   ├── api/                               # Express + Bun API Gateway
│   │   ├── src/
│   │   │   ├── index.ts                   # Main server bootstrap & routes
│   │   │   ├── audit/                     # SHA-256 Hash Chain & RFC 8785 Canonicalizer
│   │   │   ├── commerce/                  # Concession curves & pricing guardrails
│   │   │   ├── integrations/
│   │   │   │   ├── razorpay/              # Razorpay SDK initialization & webhook verifier
│   │   │   │   ├── shopify/               # Shopify OAuth & webhook HMAC sync
│   │   │   │   └── whatsapp/              # Meta Cloud API message dispatcher
│   │   │   ├── modules/
│   │   │   │   ├── agent/                 # Gemini 2.5 Flash reasoning & tool calling
│   │   │   │   ├── analytics/             # GMV, conversion rate, & revenue metrics
│   │   │   │   ├── onboarding/            # Store onboarding & API credential provisioning
│   │   │   │   ├── orders/                # Order lifecycle & settlement tracker
│   │   │   │   ├── products/              # Product catalog & CSV bulk import engine
│   │   │   │   ├── settings/              # Merchant negotiation guardrails & keys
│   │   │   │   └── simulator/             # Interactive web A2A chat simulation
│   │   │   └── payments/
│   │   │       └── razorpay/              # Deep Razorpay capabilities:
│   │   │           ├── adapter.ts         # Unified PaymentService adapter
│   │   │           ├── autopay.ts         # UPI AutoPay & RBI limit enforcement
│   │   │           ├── disputes.ts        # Audit proof compiler for disputes
│   │   │           ├── invoices.ts        # GST tax invoice calculation & PDF links
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
│       │   └── layout.tsx                 # Root layout, theme provider, & top navigation
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
│   ├── types/                             # Shared TypeScript definitions
│   │   └── src/
│   │       └── index.ts                   # Product, Store, Rules, A2A, Audit types
│   │
│   ├── config-eslint/                     # Shared ESLint configuration
│   └── config-typescript/                 # Shared TypeScript tsconfig
│
├── tests/                                 # Bun Automated Test Suites (43 Passing Tests)
│   ├── agentic-commerce-modules.test.ts   # Mandate guards, x402 V2, hash chain
│   ├── conversation-intelligence.test.ts  # 13 Conversational AI scenarios
│   ├── razorpay-advanced.test.ts          # Invoices, QR, AutoPay, Offers
│   ├── razorpay-advanced-services.test.ts # Deep Razorpay adapter tests
│   └── shopify-integration.test.ts        # Shopify webhooks & HMAC verification
│
├── website.png                            # Platform & Dashboard Showcase Screenshot
├── PRD.md                                 # Product Requirements Document
├── ARCHITECTURE.md                        # Full Technical Architecture Specification
├── package.json                           # Turborepo root configuration
├── turbo.json                             # Turborepo task pipeline
└── tsconfig.json                          # Base TypeScript configuration
```

---

## Merchant Dashboard & AI Growth Advisor

The ZapAI Merchant Dashboard ([https://zapai-com.vercel.app/dashboard](https://zapai-com.vercel.app/dashboard)) equips merchants with real-time visibility into their autonomous agent sales force:

1. **Revenue & GMV Analytics:** Live graphs displaying total sales, completed autonomous transactions, active conversations, and preserved margin.
2. **AI Growth Copilot:** An embedded conversational assistant that answers natural language questions regarding store sales, calculates saved margins, suggests price optimizations, and flags low-stock warnings.
3. **Product Catalog & Floor Price Enforcement:** View and edit product variants, listed prices, and absolute floor prices below which the AI Seller Agent is strictly forbidden to sell.
4. **Live WhatsApp Conversation Inspector:** Real-time visibility into multi-turn buyer-seller WhatsApp chats, showing how the AI interprets intent, applies offers, and issues payment challenges.
5. **8-Stage Cryptographic Audit Ledger Explorer:** Inspect SHA-256 hash chains, view cryptographic evidence payloads, and download audit bundles for regulatory compliance or Razorpay disputes.
6. **Merchant Guardrail Settings:** Configure maximum allowable discount percentages, bundle thresholds, and integrate Meta WhatsApp & Razorpay credentials.

---

## Environment Variables

Copy `.env.example` to `.env` in the project root:

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

## Quick Start & Local Development

### 1. Prerequisites
Ensure you have installed:
- [Bun](https://bun.sh/) (v1.4.0 or higher)
- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://neon.tech/) (or a free Neon serverless Postgres database)
- [Redis](https://redis.io/) (optional; in-memory fallback enabled automatically if unavailable)

### 2. Clone & Install Dependencies

```bash
git clone https://github.com/lviffy/Razorpay-Agent.git
cd Razorpay-Agent
bun install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, RAZORPAY_KEY_ID, DATABASE_URL, etc.
```

### 4. Run Database Migrations

```bash
bun run migrate
```

To seed demo products and test stores:
```bash
bun run db:seed
```

### 5. Start Development Servers

Starts both the Next.js Web Dashboard (Port 3000) and the Express API Gateway (Port 8000) concurrently via Turborepo:

```bash
bun run dev
```

- **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:8000](http://localhost:8000)
- **API Health Check:** `curl http://localhost:8000/health`

---

## Automated Test Suite (43 Tests Passing)

ZapAI includes comprehensive end-to-end automated unit, integration, and intelligence tests running on Bun's ultra-fast native test runner:

```bash
bun test
```

### Verified Test Suites:

1. **`tests/razorpay-advanced.test.ts`**:
   - Dynamic GST tax invoice calculation with automatic CGST + SGST breakdown.
   - Dynamic UPI QR code generation and RFC-compliant UPI deep-link formatting.
   - Razorpay Offers Engine discount optimization and real-time counter-offer stacking.
   - Recurring AutoPay subscription plans and token registration.
2. **`tests/razorpay-advanced-services.test.ts`**:
   - UPI AutoPay token registration & RBI ₹15,000 threshold safety limit enforcement.
   - Razorpay Route multi-vendor split distribution and automated fee take-rate calculation.
   - Instant Refunds issuance with structured dispute reasoning.
   - Cryptographic Dispute Evidence bundle compilation from audit chains.
3. **`tests/agentic-commerce-modules.test.ts`**:
   - Cryptographic AP2 spending mandate validation and zero-trust server validation.
   - Nonce replay attack prevention and timestamp expiry enforcement.
   - x402 V2 protocol challenge-response settlement and header parsing.
   - SHA-256 forward-linked audit hash verification.
4. **`tests/conversation-intelligence.test.ts`**:
   - 13 distinct multi-turn conversational commerce scenarios (e.g., direct inquiries, negotiation rounds, quantity changes, floor price rejections, catalog switching, stock inquiries).
5. **`tests/shopify-integration.test.ts`**:
   - Shopify store domain normalization.
   - Shopify webhook HMAC SHA-256 signature verification.
   - Graceful fallback for unauthenticated stores.

**Current Test Status:** `43 passing tests` across 5 suites (0 failures).

---

## API Reference

### Core Backend Routes (`apps/api/src/`)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check endpoint returning database connectivity, Redis status, and uptime. |
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

## Resiliency & Security Architecture

1. **Zero-Trust Spending Mandates:** The API server enforces strict cryptographically signed AP2 spending bounds before transmitting payment challenges to Razorpay. LLMs cannot hallucinate spending exceeding the mandate limit.
2. **Instant Redis Lock Release on Timeout:** If a buyer abandons checkout or payment fails, the Redis 120-second inventory lock (`lock:inventory:{store_id}:{variant_id}`) expires or is purged immediately (<2s), returning stock to the store.
3. **Idempotent Webhooks:** Razorpay and Shopify webhooks are logged and checked against `processed_webhook_events` to ensure exactly-once processing even under network retry spikes.
4. **Constant-Time Cryptography:** All HMAC signatures are evaluated using `crypto.timingSafeEqual` to guard against side-channel timing attacks.
5. **RFC 8785 Canonical JSON:** All payloads are canonicalized prior to SHA-256 hashing, guaranteeing ledger immutability and cross-platform verification.

---

## License & Acknowledgments

Distributed under the **[MIT License](LICENSE)**. See [`LICENSE`](LICENSE) for terms and details.

Built with pride for the **Razorpay AI Buildathon 2026** under **Track 1: AI Growth & Agentic Commerce**.  
Special thanks to the teams behind **Razorpay**, **Google Cloud & AI Studio**, **Neon Postgres**, and **Bun** for providing world-class developer tools.
