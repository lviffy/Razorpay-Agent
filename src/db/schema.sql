-- ─────────────────────────────────────────────────────────────────────────────
-- AgentBridge — Database Schema
-- Run via: bun run migrate
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Connected Stores (mock merchants for buildathon)
CREATE TABLE IF NOT EXISTS stores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    city                VARCHAR(100),
    razorpay_account_id VARCHAR(100) NOT NULL DEFAULT 'rzp_test_mock',
    currency            VARCHAR(10) DEFAULT 'INR',
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Merchant Negotiation Rules
CREATE TABLE IF NOT EXISTS negotiation_rules (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id                        UUID REFERENCES stores(id) ON DELETE CASCADE,
    max_discount_percentage         NUMERIC(5,2) DEFAULT 0.00,
    min_order_value_for_discount    NUMERIC(12,2) DEFAULT 0.00,
    free_shipping_threshold         NUMERIC(12,2),
    allow_bundle_offers             BOOLEAN DEFAULT TRUE,
    auto_accept_threshold           NUMERIC(12,2),
    created_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Catalog & Live Stock
CREATE TABLE IF NOT EXISTS products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id                UUID REFERENCES stores(id) ON DELETE CASCADE,
    shopify_product_id      VARCHAR(100) NOT NULL,   -- kept for schema compat; mock value for buildathon
    shopify_variant_id      VARCHAR(100) NOT NULL,
    title                   VARCHAR(255) NOT NULL,
    sku                     VARCHAR(100) NOT NULL,
    listed_price            NUMERIC(12,2) NOT NULL,
    floor_price             NUMERIC(12,2) NOT NULL,
    inventory_available     INT NOT NULL DEFAULT 0,
    inventory_reserved      INT DEFAULT 0,
    reservation_expires_at  TIMESTAMPTZ,
    inventory_state         VARCHAR(20) DEFAULT 'AVAILABLE',   -- AVAILABLE | RESERVED | PAYMENT_PENDING | PAID | SOLD
    agent_schema            JSONB NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, shopify_variant_id)
);

-- 4. AP2-Inspired Spending Mandates
CREATE TABLE IF NOT EXISTS mandates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id      VARCHAR(100) UNIQUE NOT NULL,
    buyer_agent_id  VARCHAR(100) NOT NULL,
    spending_limit  NUMERIC(12,2) NOT NULL,
    spent_amount    NUMERIC(12,2) DEFAULT 0,
    currency        VARCHAR(10) DEFAULT 'INR',
    purpose         VARCHAR(255),
    expires_at      TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) DEFAULT 'ACTIVE',    -- ACTIVE | EXHAUSTED | EXPIRED | CANCELLED
    signature       VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agent-to-Agent Negotiation Sessions
CREATE TYPE IF NOT EXISTS negotiation_status AS ENUM (
    'ACTIVE', 'AGREED', 'REJECTED', 'EXPIRED', 'LOCKED', 'PAID'
);

CREATE TABLE IF NOT EXISTS negotiation_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_agent_id  VARCHAR(100) NOT NULL,
    store_id        UUID REFERENCES stores(id),
    product_id      UUID REFERENCES products(id),
    mandate_id      VARCHAR(100),
    status          negotiation_status DEFAULT 'ACTIVE',
    initial_offer   NUMERIC(12,2) NOT NULL,
    agreed_price    NUMERIC(12,2),
    redis_lock_key  VARCHAR(255),
    lock_expires_at TIMESTAMPTZ,
    transcript      JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Financial Orders
CREATE TYPE IF NOT EXISTS payment_status AS ENUM (
    'CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'
);

CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES negotiation_sessions(id),
    store_id            UUID REFERENCES stores(id),
    razorpay_order_id   VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    order_id            VARCHAR(100) UNIQUE,          -- e.g. ORD-1042
    x402_tx_hash        VARCHAR(255) UNIQUE NOT NULL,
    mandate_id          VARCHAR(100),
    amount              NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'INR',
    status              payment_status DEFAULT 'CREATED',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Webhook Idempotency — prevents double-processing on Razorpay retries
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    payment_event_id    VARCHAR(100) PRIMARY KEY,
    event_type          VARCHAR(50) NOT NULL,
    processed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Immutable Five-Way Audit Ledger
CREATE TABLE IF NOT EXISTS audit_ledger (
    id                      BIGSERIAL PRIMARY KEY,
    event_type              VARCHAR(50) NOT NULL,
    whatsapp_message_id     VARCHAR(255),
    conversation_id         VARCHAR(255),
    x402_transaction_id     VARCHAR(255) NOT NULL,
    razorpay_payment_id     VARCHAR(100),
    order_id                VARCHAR(100),
    payload                 JSONB NOT NULL,
    event_checksum          VARCHAR(255) NOT NULL,    -- SHA256(prev_checksum + payload)
    timestamp               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_lookup
    ON audit_ledger (x402_transaction_id, razorpay_payment_id, order_id);

-- 9. WhatsApp conversation sessions (for worker state tracking)
CREATE TABLE IF NOT EXISTS conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     VARCHAR(255) UNIQUE NOT NULL,
    phone_number        VARCHAR(50) NOT NULL,
    buyer_agent_id      VARCHAR(100),
    mandate_id          VARCHAR(100),
    session_state       VARCHAR(50) DEFAULT 'IDLE',   -- IDLE | NEGOTIATING | AWAITING_PAYMENT | COMPLETE
    last_message_id     VARCHAR(255),
    context             JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
