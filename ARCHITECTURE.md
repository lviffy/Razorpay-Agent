# ZapAI — Production Product & System Architecture

**Document Version:** 2.0 (x402 V2 & Agentic Commerce Blueprint)  
**Target:** Enterprise Production Architecture & Razorpay AI Buildathon Submission  
**Classification:** Technical Architecture Document (TAD)

---

## 1. Executive Product & Systems Blueprint

ZapAI is an enterprise-grade agentic commerce middleware connecting digital storefronts to autonomous AI Buyer Agents and conversational messaging surfaces (WhatsApp Business Cloud API). 

It implements an **x402 V2-compatible HTTP payment boundary** with a custom **`zapai-inr` payment scheme** and a **ZapAI Settlement Facilitator**, backed by **Razorpay's Financial & Settlement Stack** with an explicit **Human Approval Fallback**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 BUYER ECOSYSTEM                                  │
│   ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────┐  │
│   │ Autonomous Buyer Agent │   │ Consumer on WhatsApp   │   │ Procurement Bot │  │
│   │   (Spending Mandate)   │   │ (Conversational Shell) │   │ (Bounded Agent) │  │
│   └───────────┬────────────┘   └───────────┬────────────┘   └────────┬────────┘  │
└───────────────┼────────────────────────────┼─────────────────────────┼───────────┘
                │                            │                         │
                ▼ (x402 V2 / REST)           ▼ (WhatsApp Cloud API)    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            ZAPAI API GATEWAY & ROUTER                            │
│       • API Ingress & Async Queue Router       • Rate Limiting & Sybil Defense   │
│       • TLS 1.3 Termination                    • Auth & Webhook Ingress (HMAC)   │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────────────────┐
│                          CORE DISTRIBUTED MODULES                                │
│                                                                                  │
│   ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────┐  │
│   │   Structured A2A       │   │   Catalog & Dynamic    │   │  Redis Atomic   │  │
│   │   Negotiation Engine   │   │    Schema Registry     │   │  TTL Lock Engine│  │
│   └───────────┬────────────┘   └───────────┬────────────┘   └────────┬────────┘  │
│               │                            │                         │           │
│   ┌───────────▼────────────┐   ┌───────────▼────────────┐   ┌────────▼────────┐  │
│   │   ZapAI Facilitator    │   │ Zero-Trust Mandate     │   │ Tamper-Evident  │  │
│   │  (x402 V2 Coordinator) │   │ Policy Evaluator       │   │ Audit Ledger    │  │
│   └───────────┬────────────┘   └────────────────────────┘   │  (SHA-256 PG)   │  │
│               │                                             └─────────────────┘  │
└───────────────┼──────────────────────────────────────────────────────────────────┘
                │
        ┌───────┴───────────────────────────────┐
        ▼ (Autonomous Settlement)               ▼ (Human Fallback Rail)
┌──────────────────────────────────┐   ┌───────────────────────────────────┐
│     RAZORPAY SETTLEMENT BUS      │   │    RAZORPAY PAYMENT LINK BUS      │
│ • Orders API (Idempotent Orders) │   │ • Test Mode Standard Payment Link │
│ • Instant Settlements (IMPS/UPI) │   │ • Direct WhatsApp CTA Delivery    │
│ • Webhook Verification (HMAC)    │   │ • User Approval / Rejection Flow  │
│ • Deduplication (x-razorpay-id)  │   │ • Synchronous State Synchronization│
└──────────────────────────────────┘   └───────────────────────────────────┘
```

---

## 2. 6-Module Component Architecture

The codebase is organized into decoupled domain modules:

```
src/
├── agents/             # Buyer & Seller AI orchestration & tool calling
├── commerce/           # Catalog discovery, structured negotiation & inventory
├── mandate/            # Spending mandate creation, cryptographic signing & zero-trust policy
├── x402/               # x402 V2 protocol handlers, headers, client, server & facilitator
├── payments/           # Gateway abstraction & Razorpay implementation
│   └── razorpay/       # Orders API, Payment Link fallback & Webhook handlers
├── orders/             # Order state machine & persistence
├── audit/              # SHA-256 hash-chained immutable audit ledger
└── whatsapp/           # Async webhook queue & message dispatching
```

---

## 3. Detailed Technical Specifications

### 3.1 Spending Mandate & Server-Side Policy Evaluator (`src/mandate/`)
Delegated authority is represented as an immutable, cryptographically signed token:

```typescript
export interface SpendingMandate {
  mandateId: string;
  buyerId: string;
  spendingLimit: number; // in paise (e.g., 400000 = ₹4,000.00)
  currency: "INR";
  purpose: {
    category?: string;
    skuIds?: string[];
  };
  merchantAllowlist?: string[];
  expiresAt: string; // ISO 8601
  nonce: string;     // Unique single-use challenge
  signature: string; // HMAC-SHA256(secret, canonicalPayload) or Ed25519
}
```

#### Deterministic Policy Evaluator (`verifyMandate`)
The LLM does NOT enforce spending rules. The server validates:
1. `verifySignature(mandate)` is cryptographically valid.
2. `Date.now() <= new Date(mandate.expiresAt).getTime()`.
3. `isNonceUnused(mandate.nonce)` prevents replay attacks.
4. `mandate.currency === "INR"`.
5. `requestAmount <= mandate.spendingLimit`.
6. `!mandate.merchantAllowlist || mandate.merchantAllowlist.includes(merchantId)`.
7. `!mandate.purpose.skuIds || mandate.purpose.skuIds.includes(skuId)`.

---

### 3.2 Structured A2A Negotiation Protocol (`src/commerce/`)
All communication between Buyer and Seller agents is structured as strongly typed JSON events:

```
OFFER ──► COUNTER_OFFER ──► ACCEPT ──► RESERVE ──► PAYMENT_REQUIRED
```

* **`OFFER` Payload:**
```json
{
  "type": "OFFER",
  "offerId": "off_98124",
  "conversationId": "conv_wa_102",
  "merchantId": "runfast",
  "skuId": "SKU-SHOE-001",
  "quantity": 1,
  "price": 399900,
  "currency": "INR",
  "expiresAt": "2026-08-31T18:35:00Z"
}
```
* **`COUNTER_OFFER` Payload:**
```json
{
  "type": "COUNTER_OFFER",
  "offerId": "off_98124",
  "counterOfferId": "cnt_98125",
  "price": 379900,
  "discount": 20000,
  "currency": "INR",
  "bundleItems": [{ "skuId": "SKU-SOCK-001", "price": 0 }],
  "expiresAt": "2026-08-31T18:35:00Z"
}
```
* **`ACCEPT` Payload:**
```json
{
  "type": "ACCEPT",
  "counterOfferId": "cnt_98125",
  "agreedPrice": 379900,
  "currency": "INR"
}
```

---

### 3.3 Atomic Inventory Reservation State Machine (`src/commerce/inventory.ts`)
Inventory follows a strict transactional state machine:

```
AVAILABLE ──► RESERVED ──► PAYMENT_PENDING ──┬──► PAID (SOLD)
                                             └──► EXPIRED ──► AVAILABLE
```

#### Concurrency & Locking Strategy:
* **Postgres Source of Truth:**
  ```sql
  BEGIN;
    SELECT inventory_available FROM variants WHERE id = $1 FOR UPDATE;
    UPDATE variants 
    SET inventory_available = inventory_available - $quantity,
        inventory_reserved = inventory_reserved + $quantity
    WHERE id = $1 AND inventory_available >= $quantity;
  COMMIT;
  ```
* **Redis Atomic Lock:**
  * Key: `lock:reservation:{reservationId}`
  * TTL: `120` seconds
  * Auto-expiry returns reserved count to `inventory_available` if payment is not captured within 120s.

---

### 3.4 x402 V2 Protocol & ZapAI Facilitator (`src/x402/`)

ZapAI adheres to modern x402 V2 header semantics:

#### 1. Seller Challenge: `PAYMENT-REQUIRED`
HTTP Status: `402 Payment Required`
Header: `PAYMENT-REQUIRED: <base64-json>`

```json
{
  "scheme": "exact",
  "network": "zapai-inr",
  "amount": "379900",
  "asset": "INR",
  "payTo": "merchant_runfast",
  "resource": "order/ORD-1042",
  "expiresAt": "2026-08-31T18:35:00Z",
  "nonce": "nonce_77af98b1"
}
```

#### 2. Buyer Payment Authorization: `PAYMENT-SIGNATURE`
Header: `PAYMENT-SIGNATURE: <base64-json>`

```json
{
  "paymentId": "zap_pay_1029",
  "mandateId": "mandate_8819",
  "resource": "order/ORD-1042",
  "amount": "379900",
  "currency": "INR",
  "nonce": "nonce_77af98b1",
  "timestamp": "2026-08-31T18:33:10Z",
  "signature": "sig_hmac_99812..."
}
```

#### 3. Facilitator Verification & Settlement (`POST /x402/verify` & `POST /x402/settle`)
* `/x402/verify`: Executes deterministic zero-trust validation of the mandate and signature.
* `/x402/settle`: Coordinates payment execution via the payment adapter and returns `PAYMENT-RESPONSE`.

---

### 3.5 Razorpay Integration & Webhook Handling (`src/payments/razorpay/`)

#### Orders API & Receipt Idempotency:
* `POST /v1/orders` with payload:
  ```json
  {
    "amount": 379900,
    "currency": "INR",
    "receipt": "zap_pay_1029",
    "notes": {
      "mandateId": "mandate_8819",
      "orderId": "ORD-1042",
      "x402Network": "zapai-inr"
    }
  }
  ```

#### Webhook Ingress & Idempotency:
* Endpoint: `POST /webhooks/razorpay`
* Header Verification: `X-Razorpay-Signature` calculated against **raw byte body**.
* Deduplication: `x-razorpay-event-id` checked against `processed_webhook_events` table before applying state updates.
* Resilient Transitions: Handles out-of-order events (`payment.authorized` $\to$ `payment.captured` $\to$ `payment.failed`).

---

### 3.6 Tamper-Evident Hash-Chained Audit Ledger (`src/audit/`)

Every action forms an immutable cryptographic node:
$$H_n = \text{SHA256}(H_{n-1} \parallel \text{eventType} \parallel \text{actor} \parallel \text{payloadHash} \parallel \text{timestamp})$$

```sql
CREATE TABLE audit_ledger (
  sequence_id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(64) UNIQUE NOT NULL,
  transaction_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  actor VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  current_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. End-to-End Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    participant U as User (WhatsApp)
    participant BA as Buyer Agent
    participant SA as Seller Agent
    participant DB as Postgres + Redis
    participant ZF as ZapAI Facilitator
    participant RZ as Razorpay Adapter
    participant AL as Audit Ledger

    U->>BA: "Find running shoes under ₹4,000"
    BA->>SA: A2A OFFER (SKU-SHOE-001, ₹3,999)
    SA->>BA: A2A COUNTER_OFFER (₹3,799 + free shipping)
    BA->>SA: A2A ACCEPT (₹3,799)
    SA->>DB: Atomic Lock Inventory (Redis TTL 120s)
    SA-->>BA: HTTP 402 PAYMENT-REQUIRED (zapai-inr)
    BA->>BA: Evaluate Mandate & Sign Authorization
    BA->>ZF: PAYMENT-SIGNATURE
    ZF->>ZF: verifyMandate (Zero-Trust Server Policy)
    ZF->>AL: Log PAYMENT_AUTHORIZED (Hash Chained)
    
    alt Autonomous Rail Available
        ZF->>RZ: Settle Order (Orders API)
        RZ-->>ZF: Settlement Authoritative Confirmation
    else Human Fallback Required
        ZF->>RZ: Create Payment Link
        RZ->>U: WhatsApp CTA Payment Link (Test Mode)
        U->>RZ: Approves in Checkout
        RZ->>ZF: Webhook payment.captured (HMAC Verified)
    end

    ZF->>DB: Inventory State -> PAID
    ZF->>AL: Log PAYMENT_CAPTURED & ORDER_CREATED
    ZF->>U: Order Confirmation + 5-Field Audit Proof
```
