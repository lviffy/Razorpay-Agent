# AgentBridge — Production Product & System Architecture

**Document Version:** 1.0 (Production Blueprint)  
**Target:** Enterprise Production Deployment & Long-Term System Architecture  
**Classification:** Technical Architecture Document (TAD)

---

## 1. Executive Product Architecture

AgentBridge is an enterprise-grade agentic commerce middleware connecting e-commerce platforms (starting with Shopify) to autonomous AI Buyer Agents and conversational surfaces (WhatsApp Business Cloud API). It operates on a **Fiat-Native x402 Protocol** using **Razorpay’s Financial & Settlement Stack** as the core money movement and trust engine.

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
│                         AGENTBRIDGE GATEWAY & ROUTER                             │
│       • API Gateway (Envoy/Kong)         • Rate Limiting & Sybil Defense         │
│       • TLS 1.3 Termination              • Auth & Identity Management (JWT)      │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────────────────┐
│                          CORE DISTRIBUTED SERVICES                               │
│                                                                                  │
│   ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────┐  │
│   │    A2A Negotiation     │   │   Catalog & Dynamic    │   │  Redis Redlock  │  │
│   │    Protocol Engine     │   │    Schema Registry     │   │  Locking Engine │  │
│   └───────────┬────────────┘   └───────────┬────────────┘   └────────┬────────┘  │
│               │                            │                         │           │
│   ┌───────────▼────────────┐   ┌───────────▼────────────┐   ┌────────▼────────┐  │
│   │   Razorpay Payment     │   │  Shopify Sync Engine   │   │ Immutable Audit │  │
│   │   State Machine        │   │  (GraphQL + Webhooks)  │   │ Ledger (PG/TS)  │  │
│   └────────────────────────┘   └────────────────────────┘   └─────────────────┘  │
└───────────────────┬─────────────────────────────────────────────┬────────────────┘
                    │                                             │
                    ▼                                             ▼
┌──────────────────────────────────────┐     ┌─────────────────────────────────────┐
│          RAZORPAY FINANCIAL BUS      │     │           SHOPIFY MERCHANTS         │
│   • Orders API & Optimizer           │     │   • Shopify Admin GraphQL API       │
│   • Instant Settlements (IMPS/UPI)   │     │   • Bulk Operations API             │
│   • Smart Collect & Virtual Accounts │     │   • Real-Time Webhooks Engine       │
│   • Route (Marketplace Splits)       │     │   • Multi-Store Fulfillment         │
│   • Vulcan AI & Thirdwatch Scoring   │     │                                     │
│   • Invoices API (Automated GST)     │     │                                     │
└──────────────────────────────────────┘     └─────────────────────────────────────┘
```

---

## 2. Component Microservice Architecture

The production architecture decomposes into 7 decoupled, horizontally scalable services communicating over gRPC internally and REST/WebSockets externally.

### 2.1 API Gateway & Ingress Layer
- **Technology:** Envoy / Kong API Gateway
- **Responsibilities:**
  - Ingress traffic routing for WhatsApp Webhooks, Buyer Agent HTTP 402 requests, and Merchant Portal APIs.
  - JWT token verification and API key validation.
  - Agent rate limiting (Token Bucket algorithm per IP / Buyer Agent ID) to prevent scraping or brute-force price querying.
  - Mutual TLS (mTLS) for inter-service communication.

### 2.2 Catalog & Schema Transformation Service
- **Responsibilities:**
  - Pulls raw Shopify product, inventory, and collection data via Shopify GraphQL Admin API.
  - Employs **Shopify Bulk Operations API** for stores with >50,000 SKUs.
  - Generates machine-readable **Agent JSON Schemas** (containing variant IDs, pricing tiers, minimum allowed floor prices, and dynamic stock levels).
  - Generates **WhatsApp Interactive Catalog Payloads** (Multi-Product Messages, List Messages, Quick-Reply Buttons).

### 2.3 Dual-Agent Orchestration & A2A Engine
- **Seller Agent Module:**
  - Evaluates buyer queries against pre-configured merchant rules stored in PostgreSQL.
  - Executes multi-turn negotiation logic (discount limits, bundle triggers, shipping rules).
  - Produces structured negotiation steps (`PROPOSE`, `COUNTER`, `ACCEPT`, `REJECT`).
- **Buyer Agent Module:**
  - Evaluates user-specified constraints (budget cap, size, color, delivery timeline).
  - Executes parallel multi-store querying across multiple Seller Agents.
  - Submits verifiable cryptographic requests over HTTP.

### 2.4 Distributed Inventory Reservation & Locking Engine
- **Technology:** Redis Cluster with Redlock Algorithm
- **Mechanism:**
  - On deal acceptance, reserves inventory for a strict Time-To-Live (`TTL = 120 seconds`).
  - Key format: `lock:inventory:{store_id}:{variant_id}`
  - Atomic compare-and-set (`SET resource_name my_random_value NX PX 120000`).
  - If payment succeeds before TTL expiry, lock converts to permanent deduction.
  - If payment fails or times out, key expires automatically, returning inventory to public pool without orphaned stock.

### 2.5 Razorpay Payment & Financial State Machine
- **Responsibilities:**
  - Translates negotiated cart into Razorpay Orders (`POST /v1/orders`).
  - Dispatches `HTTP 402` payload to Buyer Agent.
  - Listens to Razorpay Webhooks (`payment.captured`, `payment.failed`, `settlement.processed`).
  - Enforces HMAC-SHA256 signature verification on all inbound webhooks.
  - Calls **Razorpay Instant Settlements API** (`POST /v1/settlements/ondemand`) to trigger real-time bank payout.
  - Triggers **Razorpay Invoices API** to generate GST-compliant digital invoices.

### 2.6 Shopify Write-Back & Fulfillment Worker
- **Responsibilities:**
  - Asynchronously creates Shopify orders via GraphQL `orderCreate` mutation once `payment.captured` is verified.
  - Tags order with: `agentic_commerce`, `razorpay_payment_id`, `x402_tx_hash`, `buyer_agent_id`.
  - Decrements Shopify inventory levels via `inventoryAdjustQuantities`.
  - Injects shipping updates back into the WhatsApp conversation thread upon fulfillment.

### 2.7 Immutable Audit Ledger & Event Store
- **Technology:** PostgreSQL with TimescaleDB extension / Append-Only Event Tables.
- **Data Model:** Records the complete 4-way linked transaction history:
  - `whatsapp_message_id`
  - `x402_challenge_hash`
  - `razorpay_payment_id`
  - `shopify_order_id`
  - `agent_reasoning_trace`

---

## 3. The Fiat-Native x402 Protocol Specification

The system uses standard HTTP semantics for machine-to-machine commerce negotiation and settlement:

```
Buyer Agent                                                   AgentBridge Gateway (Seller)
    │                                                                      │
    │ ─── 1. POST /api/v1/a2a/negotiate {sku, target_price} ────────────► │
    │ ◄── 2. 200 OK {status: "OFFER_ACCEPTED", agreed_price: 379900} ─── │
    │                                                                      │
    │ ─── 3. POST /api/v1/checkout/reserve {deal_id} ────────────────────► │
    │ ◄── 4. HTTP 402 Payment Required ─────────────────────────────────── │
    │        Headers:                                                      │
    │          X-402-Version: 1.0                                          │
    │          X-402-Scheme: razorpay-inr                                  │
    │          X-402-Order-ID: order_Nz123abc                              │
    │          X-402-Amount: 379900                                        │
    │          X-402-Expiry: 1724161800                                    │
    │          X-402-Challenge: <HMAC_SIGNED_PAYLOAD>                      │
    │                                                                      │
    │ ─── 5. POST /api/v1/checkout/pay ──────────────────────────────────► │
    │        Headers:                                                      │
    │          X-402-Authorization: <UPI_MANDATE_AUTH_TOKEN>               │
    │                                                                      │
    │                                                    [Razorpay Captures]
    │                                                    [Instant Settlement IMPS]
    │                                                                      │
    │ ◄── 6. 200 OK (Payment Complete) ─────────────────────────────────── │
    │        Headers:                                                      │
    │          X-402-Receipt: rzp_pay_Xyz123                               │
    │          X-Shopify-Order: #1042                                      │
```

---

## 4. Deep Razorpay Integration Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                RAZORPAY PLATFORM                                 │
└──────┬──────────────────────┬──────────────────────┬──────────────────────┬──────┘
       │                      │                      │                      │
       ▼ (Inbound Core)       ▼ (AI & Optimization)  ▼ (Disbursement)       ▼ (Risk & Auth)
┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Orders API  │       │  Optimizer   │       │   Instant    │       │  Vulcan AI   │
│  Webhooks    │       │  Magic Ckout │       │ Settlements  │       │  TokenHQ     │
│  SmartCollect│       │  Offers API  │       │ RazorpayX    │       │  Thirdwatch  │
│  Dynamic QR  │       │  Invoices    │       │ Route        │       │  AutoPay     │
└──────────────┘       └──────────────┘       └──────────────┘       └──────────────┘
```

| Razorpay Module | Production Function | Fallback / Failure Path |
|---|---|---|
| **Orders API** | Idempotent transaction generation with cryptographic x402 receipt binding. | Exponential backoff retry with same idempotency key. |
| **Optimizer** | Dynamic AI routing across SBI, HDFC, ICICI, and Axis acquiring banks for highest UPI success. | Automated downgrade to tokenized card or Netbanking. |
| **Webhooks Engine** | HMAC-SHA256 verified event bus triggering atomic inventory changes on `payment.captured`. | Redundant webhook polling worker checking order status every 30s. |
| **Instant Settlements** | Programmatic payout (`/v1/settlements/ondemand`) delivering INR to merchant's bank via IMPS/UPI in 10-15s. | Automatic retry or rollover to standard scheduled batch settlement. |
| **Smart Collect 2.0** | Dedicated Virtual VPAs (`agent.<buyer_id>@rzp`) for managing pre-funded agent balances and auto-reconciliation. | Manual UPI payment link fallback. |
| **Dynamic QR Codes** | Dynamic BharatQR/UPI QR generation pushed into WhatsApp for hybrid human+agent handoffs. | Payment Link via WhatsApp message. |
| **UPI AutoPay** | Pre-authorized customer recurring mandates allowing autonomous agent purchases up to user limit. | WhatsApp interactive authorization prompt sent to user. |
| **TokenHQ** | RBI-compliant tokenized card storage for 1-click machine-authorized payments. | Standard 3DS/OTP challenge redirected to user. |
| **Route API** | Automated multi-vendor split settlements for multi-store carts + platform take-rate deduction. | Direct single-merchant capture with ledger adjustment. |
| **Vulcan AI** | Real-time agent risk scoring (detects rapid automated sweeps, coupon abuse, spoofed orders). | Temporary transaction hold + merchant WhatsApp alert. |
| **Thirdwatch ML** | AI-driven RTO (Return-to-Origin) risk prediction on COD and hybrid checkout flows. | Disables COD option for high-risk buyer profiles. |
| **Invoices API** | Automated GST-compliant tax invoice PDF generation dispatched via WhatsApp. | Async invoice generation worker retry. |
| **Refunds API** | Instant automated refunds (`POST /v1/payments/{id}/refund`) when post-capture physical stock conflict occurs. | Merchant escalation dashboard alert. |

---

## 5. Production Database Schema (PostgreSQL DDL)

```sql
-- 1. Connected Shopify Stores
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token_encrypted BYTEA NOT NULL,
    razorpay_account_id VARCHAR(100) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Merchant Negotiation Rules & Guardrails
CREATE TABLE negotiation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    max_discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    min_order_value_for_discount NUMERIC(12,2) DEFAULT 0.00,
    free_shipping_threshold NUMERIC(12,2),
    allow_bundle_offers BOOLEAN DEFAULT TRUE,
    auto_accept_threshold NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Catalog & Live Stock Cache
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    shopify_product_id VARCHAR(100) NOT NULL,
    shopify_variant_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    listed_price NUMERIC(12,2) NOT NULL,
    floor_price NUMERIC(12,2) NOT NULL,
    available_inventory INT NOT NULL,
    locked_inventory INT DEFAULT 0,
    agent_schema JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, shopify_variant_id)
);

-- 4. Agent-to-Agent Sessions & Negotiation State
CREATE TYPE negotiation_status AS ENUM ('ACTIVE', 'AGREED', 'REJECTED', 'EXPIRED', 'LOCKED', 'PAID');

CREATE TABLE negotiation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_agent_id VARCHAR(100) NOT NULL,
    store_id UUID REFERENCES stores(id),
    product_id UUID REFERENCES products(id),
    status negotiation_status DEFAULT 'ACTIVE',
    initial_offer NUMERIC(12,2) NOT NULL,
    agreed_price NUMERIC(12,2),
    redis_lock_key VARCHAR(255),
    lock_expires_at TIMESTAMPTZ,
    transcript JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Financial Orders & Razorpay Settlement State
CREATE TYPE payment_status AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES negotiation_sessions(id),
    store_id UUID REFERENCES stores(id),
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    shopify_order_id VARCHAR(100) UNIQUE,
    x402_tx_hash VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status payment_status DEFAULT 'CREATED',
    is_settled_instantly BOOLEAN DEFAULT FALSE,
    instant_settlement_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Immutable Four-Way Audit Trail
CREATE TABLE audit_ledger (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    whatsapp_message_id VARCHAR(255),
    x402_hash VARCHAR(255) NOT NULL,
    razorpay_payment_id VARCHAR(100),
    shopify_order_id VARCHAR(100),
    payload JSONB NOT NULL,
    signature VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_lookup ON audit_ledger (x402_hash, razorpay_payment_id, shopify_order_id);
```

---

## 6. Security, Compliance & Data Governance

### 6.1 Cryptographic Integrity & Anti-Replay
1. **Webhook Signatures:** Razorpay webhooks validate `X-Razorpay-Signature` via HMAC-SHA256 using the stored merchant webhook secret.
2. **x402 Challenge Tokens:** Nonce-based, signed JWTs with strict 120-second TTL to eliminate replay attacks.
3. **Idempotency Keys:** All outbound Razorpay and Shopify API calls attach `X-Idempotency-Key: uuidv5(session_id + state)` ensuring zero duplicate charges.

### 6.2 Data Localization & Regulatory Compliance
- **RBI Compliance:** Card details are never stored directly; all transactions comply with RBI Tokenization guidelines using **Razorpay TokenHQ**.
- **DPDP Act (2023) Compliance:** PII (WhatsApp phone numbers, customer delivery addresses) is encrypted at rest using AES-256 with key rotation via AWS KMS.
- **Audit Immutability:** Audit trail records are stored in append-only tables with cryptographic checksum chaining.

---

## 7. High-Availability & Disaster Recovery SLAs

```
┌───────────────────────────────────────┬───────────────────────────────┐
│ Metric                                │ Production Target             │
├───────────────────────────────────────┼───────────────────────────────┤
│ API Gateway Availability              │ 99.99% Uptime                 │
│ Payment Handshake Latency (x402)      │ < 1.2 seconds                 │
│ Inventory Lock Acquisition Latency    │ < 15 milliseconds             │
│ Webhook Processing Latency            │ < 250 milliseconds            │
│ Instant Settlement Completion Time    │ < 15 seconds (24x7 IMPS/UPI)  │
│ Recovery Time Objective (RTO)         │ < 60 seconds (Failover)       │
│ Recovery Point Objective (RPO)        │ 0 (Zero financial data loss)  │
└───────────────────────────────────────┴───────────────────────────────┘
```

---

## 8. Deployment Topology

```
                         Internet
                            │
               [Cloudflare Enterprise DDoS/WAF]
                            │
               [AWS Application Load Balancer]
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
   [EKS Cluster - AZ 1]               [EKS Cluster - AZ 2]
   ├── Gateway Pods                   ├── Gateway Pods
   ├── A2A Negotiation Engine         ├── A2A Negotiation Engine
   ├── Razorpay State Machine         ├── Razorpay State Machine
   └── Shopify Webhook Workers        └── Shopify Webhook Workers
         │                                     │
         └──────────────────┬──────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
[Redis Cluster]       [Amazon Aurora]      [TimescaleDB]
(Redlock TTLs)       (PostgreSQL Multi-AZ)  (Append-Only Audit)
```

This production architecture specification serves as the foundational engineering standard for the long-term enterprise deployment of AgentBridge.
