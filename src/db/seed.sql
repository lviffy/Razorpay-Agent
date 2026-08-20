-- ─────────────────────────────────────────────────────────────────────────────
-- AgentBridge — Seed Data
-- Two mock merchants pre-loaded for buildathon demo
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Store A: RunFast Sports (Bengaluru) ───────────────────────────────────────
INSERT INTO stores (id, name, city, razorpay_account_id, currency, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'RunFast Sports',
    'Bengaluru',
    'rzp_test_mock_store_a',
    'INR',
    true
) ON CONFLICT DO NOTHING;

-- Store A negotiation rules: 8% max discount on orders > ₹2,000; free shipping > ₹3,000
INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    8.00,
    2000.00,
    3000.00,
    true
) ON CONFLICT DO NOTHING;

-- Store A — Product 1: Nike Air Zoom Pegasus (running shoes)
INSERT INTO products (
    id, store_id, shopify_product_id, shopify_variant_id,
    title, sku, listed_price, floor_price,
    inventory_available, inventory_reserved, inventory_state,
    agent_schema
) VALUES (
    'p1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-001', 'mock-var-001',
    'Nike Air Zoom Pegasus 41 (Running Shoes)',
    'SKU-SHOE-001',
    3999.00, 3500.00,
    10, 0, 'AVAILABLE',
    '{
        "variantId": "mock-var-001",
        "title": "Nike Air Zoom Pegasus 41 (Running Shoes)",
        "sku": "SKU-SHOE-001",
        "listedPrice": 3999,
        "floorPrice": 3500,
        "inventoryAvailable": 10,
        "attributes": {
            "brand": "Nike",
            "size": "UK 8",
            "color": "Black/White",
            "category": "running shoes",
            "type": "footwear"
        }
    }'::jsonb
) ON CONFLICT (store_id, shopify_variant_id) DO NOTHING;

-- Store A — Product 2: Sports Socks
INSERT INTO products (
    id, store_id, shopify_product_id, shopify_variant_id,
    title, sku, listed_price, floor_price,
    inventory_available, inventory_reserved, inventory_state,
    agent_schema
) VALUES (
    'p1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-002', 'mock-var-002',
    'RunFast Pro Sports Socks (Pack of 3)',
    'SKU-SOCK-001',
    499.00, 400.00,
    50, 0, 'AVAILABLE',
    '{
        "variantId": "mock-var-002",
        "title": "RunFast Pro Sports Socks (Pack of 3)",
        "sku": "SKU-SOCK-001",
        "listedPrice": 499,
        "floorPrice": 400,
        "inventoryAvailable": 50,
        "attributes": {
            "brand": "RunFast",
            "size": "Free Size",
            "color": "White",
            "category": "socks",
            "type": "footwear accessory"
        }
    }'::jsonb
) ON CONFLICT (store_id, shopify_variant_id) DO NOTHING;

-- ── Store B: SpeedGear (Mumbai) ───────────────────────────────────────────────
INSERT INTO stores (id, name, city, razorpay_account_id, currency, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'SpeedGear',
    'Mumbai',
    'rzp_test_mock_store_b',
    'INR',
    true
) ON CONFLICT DO NOTHING;

-- Store B negotiation rules: 6% max discount on orders > ₹3,000; free shipping > ₹4,000
INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    6.00,
    3000.00,
    4000.00,
    true
) ON CONFLICT DO NOTHING;

-- Store B — Product 1: Nike Air Zoom Pegasus (same shoes, higher listed price)
INSERT INTO products (
    id, store_id, shopify_product_id, shopify_variant_id,
    title, sku, listed_price, floor_price,
    inventory_available, inventory_reserved, inventory_state,
    agent_schema
) VALUES (
    'p2000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'mock-prod-003', 'mock-var-003',
    'Nike Air Zoom Pegasus 41 (Running Shoes)',
    'SKU-SHOE-002',
    4199.00, 3700.00,
    8, 0, 'AVAILABLE',
    '{
        "variantId": "mock-var-003",
        "title": "Nike Air Zoom Pegasus 41 (Running Shoes)",
        "sku": "SKU-SHOE-002",
        "listedPrice": 4199,
        "floorPrice": 3700,
        "inventoryAvailable": 8,
        "attributes": {
            "brand": "Nike",
            "size": "UK 8",
            "color": "Black/White",
            "category": "running shoes",
            "type": "footwear"
        }
    }'::jsonb
) ON CONFLICT (store_id, shopify_variant_id) DO NOTHING;

-- Store B — Product 2: Sports Tee
INSERT INTO products (
    id, store_id, shopify_product_id, shopify_variant_id,
    title, sku, listed_price, floor_price,
    inventory_available, inventory_reserved, inventory_state,
    agent_schema
) VALUES (
    'p2000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'mock-prod-004', 'mock-var-004',
    'SpeedGear DriFit Sports Tee',
    'SKU-TEE-001',
    899.00, 750.00,
    20, 0, 'AVAILABLE',
    '{
        "variantId": "mock-var-004",
        "title": "SpeedGear DriFit Sports Tee",
        "sku": "SKU-TEE-001",
        "listedPrice": 899,
        "floorPrice": 750,
        "inventoryAvailable": 20,
        "attributes": {
            "brand": "SpeedGear",
            "size": "M",
            "color": "Navy Blue",
            "category": "sports tee",
            "type": "apparel"
        }
    }'::jsonb
) ON CONFLICT (store_id, shopify_variant_id) DO NOTHING;
