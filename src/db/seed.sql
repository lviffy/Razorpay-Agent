-- ─────────────────────────────────────────────────────────────────────────────
-- ZapAI — Seed Data
-- Full realistic merchant, product, conversation, order, and audit ledger seed
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Seed Authenticated Merchant Users ─────────────────────────────────────────
INSERT INTO users (id, email, password_hash, name, role, store_id, phone, provider, is_active)
VALUES 
    (
        '10000000-0000-0000-0000-000000000001',
        'merchant@runfast.in',
        '$2b$10$na6oVRFPvYTlOyRtYinKJOz8ORXD8AagbZM9BDo7ja1vg8gtaskIW',
        'Rahul Mehta',
        'merchant_owner',
        'a0000000-0000-0000-0000-000000000001',
        '+91 98765 00000',
        'credentials',
        true
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'merchant@runfastsports.in',
        '$2b$10$na6oVRFPvYTlOyRtYinKJOz8ORXD8AagbZM9BDo7ja1vg8gtaskIW',
        'Rahul Mehta',
        'merchant_owner',
        'a0000000-0000-0000-0000-000000000001',
        '+91 98765 00000',
        'credentials',
        true
    ),
    (
        '20000000-0000-0000-0000-000000000001',
        'support@speedgear.in',
        '$2b$10$na6oVRFPvYTlOyRtYinKJOz8ORXD8AagbZM9BDo7ja1vg8gtaskIW',
        'Vikram Shah',
        'merchant_owner',
        'b0000000-0000-0000-0000-000000000002',
        '+91 98111 22334',
        'credentials',
        true
    )
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    store_id = EXCLUDED.store_id,
    phone = EXCLUDED.phone;

-- ── Store A: RunFast Sports (Bengaluru) ───────────────────────────────────────
INSERT INTO stores (id, name, city, phone, email, role, razorpay_account_id, currency, is_active, agent_settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'RunFast Sports',
    'Bengaluru',
    '+91 98765 00000',
    'merchant@runfastsports.in',
    'Store Owner & Admin',
    'rzp_test_mock_store_a',
    'INR',
    true,
    '{"name":"RunFast AI Seller","tone":"friendly","status":"active","autoNegotiationEnabled":true,"humanEscalationEnabled":true,"escalationThresholdAmount":5000}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    agent_settings = EXCLUDED.agent_settings;

-- Store A negotiation rules
INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers, risk_profile, human_approval_above, alternative_products_enabled)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    12.00,
    2000.00,
    3000.00,
    true,
    'balanced',
    5000.00,
    true
) ON CONFLICT DO NOTHING;

-- ── Store B: SpeedGear (Mumbai) ───────────────────────────────────────────────
INSERT INTO stores (id, name, city, phone, email, role, razorpay_account_id, currency, is_active, agent_settings)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'SpeedGear',
    'Mumbai',
    '+91 98111 22334',
    'support@speedgear.in',
    'Regional Manager',
    'rzp_test_mock_store_b',
    'INR',
    true,
    '{"name":"SpeedGear Commerce Agent","tone":"professional","status":"active","autoNegotiationEnabled":true,"humanEscalationEnabled":true,"escalationThresholdAmount":4500}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    agent_settings = EXCLUDED.agent_settings;

INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers, risk_profile, human_approval_above, alternative_products_enabled)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    10.00,
    3000.00,
    4000.00,
    true,
    'conservative',
    4500.00,
    true
) ON CONFLICT DO NOTHING;

-- ── Products for Store A ──────────────────────────────────────────────────────
INSERT INTO products (
    id, store_id, shopify_product_id, shopify_variant_id,
    title, sku, listed_price, floor_price,
    inventory_available, inventory_reserved, inventory_state,
    is_ai_enabled, category, description,
    agent_schema
) VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-001', 'mock-var-001',
    'Nike Air Zoom Pegasus 41 (Running Shoes)',
    'SKU-SHOE-001',
    3999.00, 3500.00,
    18, 0, 'AVAILABLE',
    true, 'Footwear', 'Responsive everyday road running shoe with dual Zoom Air units and engineered mesh upper.',
    '{
        "variantId": "mock-var-001",
        "title": "Nike Air Zoom Pegasus 41 (Running Shoes)",
        "sku": "SKU-SHOE-001",
        "listedPrice": 3999,
        "floorPrice": 3500,
        "inventoryAvailable": 18,
        "attributes": {
            "brand": "Nike",
            "size": "UK 10",
            "color": "Black/White",
            "category": "running shoes",
            "type": "footwear"
        }
    }'::jsonb
),
(
    'c1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-002', 'mock-var-002',
    'RunFast Pro Sports Socks (Pack of 3)',
    'SKU-SOCK-001',
    499.00, 400.00,
    50, 0, 'AVAILABLE',
    true, 'Accessories', 'High-cushion anti-blister athletic socks with arch compression support.',
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
),
(
    'c1000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-005', 'mock-var-005',
    'Adidas Ultraboost Light Running Shoes',
    'SKU-UB-001',
    5499.00, 4800.00,
    6, 0, 'AVAILABLE',
    true, 'Footwear', 'Ultralight road running shoe with Continental rubber grip and 30% lighter Boost capsule midsole.',
    '{
        "variantId": "mock-var-005",
        "title": "Adidas Ultraboost Light Running Shoes",
        "sku": "SKU-UB-001",
        "listedPrice": 5499,
        "floorPrice": 4800,
        "inventoryAvailable": 6,
        "attributes": {
            "brand": "Adidas",
            "size": "UK 9",
            "color": "Core Black",
            "category": "running shoes",
            "type": "footwear"
        }
    }'::jsonb
),
(
    'c1000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-006', 'mock-var-006',
    'Puma Velocity Nitro 3',
    'SKU-PUMA-001',
    4299.00, 3750.00,
    14, 0, 'AVAILABLE',
    true, 'Footwear', 'Nitrogen-infused foam daily running trainer engineered for maximum energy return and comfort.',
    '{
        "variantId": "mock-var-006",
        "title": "Puma Velocity Nitro 3",
        "sku": "SKU-PUMA-001",
        "listedPrice": 4299,
        "floorPrice": 3750,
        "inventoryAvailable": 14,
        "attributes": {
            "brand": "Puma",
            "size": "UK 8",
            "color": "Sun Stream/Puma Black",
            "category": "running shoes",
            "type": "footwear"
        }
    }'::jsonb
),
(
    'c1000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'mock-prod-007', 'mock-var-007',
    'RunFast Aeroready Training Tee',
    'SKU-TEE-002',
    799.00, 650.00,
    35, 0, 'AVAILABLE',
    true, 'Apparel', 'Moisture-wicking breathable gym and marathon training tshirt with reflective trims.',
    '{
        "variantId": "mock-var-007",
        "title": "RunFast Aeroready Training Tee",
        "sku": "SKU-TEE-002",
        "listedPrice": 799,
        "floorPrice": 650,
        "inventoryAvailable": 35,
        "attributes": {
            "brand": "RunFast",
            "size": "L",
            "color": "Steel Grey",
            "category": "sports tee",
            "type": "apparel"
        }
    }'::jsonb
)
ON CONFLICT (store_id, shopify_variant_id) DO UPDATE SET
    title = EXCLUDED.title,
    listed_price = EXCLUDED.listed_price,
    floor_price = EXCLUDED.floor_price,
    inventory_available = EXCLUDED.inventory_available,
    is_ai_enabled = EXCLUDED.is_ai_enabled,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    agent_schema = EXCLUDED.agent_schema;

-- ── Products for Store B ──────────────────────────────────────────────────────
INSERT INTO products (
    id, store_id, shopify_product_id, shopify_variant_id,
    title, sku, listed_price, floor_price,
    inventory_available, inventory_reserved, inventory_state,
    is_ai_enabled, category, description,
    agent_schema
) VALUES
(
    'c2000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'mock-prod-003', 'mock-var-003',
    'Nike Air Zoom Pegasus 41 (Running Shoes)',
    'SKU-SHOE-002',
    4199.00, 3700.00,
    8, 0, 'AVAILABLE',
    true, 'Footwear', 'Premium road running shoes with ReactX foam and dual Zoom Air units.',
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
),
(
    'c2000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'mock-prod-004', 'mock-var-004',
    'SpeedGear DriFit Sports Tee',
    'SKU-TEE-001',
    899.00, 750.00,
    20, 0, 'AVAILABLE',
    true, 'Apparel', 'Quick-dry activewear training shirt with breathable side vents.',
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
)
ON CONFLICT (store_id, shopify_variant_id) DO UPDATE SET
    title = EXCLUDED.title,
    listed_price = EXCLUDED.listed_price,
    floor_price = EXCLUDED.floor_price,
    inventory_available = EXCLUDED.inventory_available,
    is_ai_enabled = EXCLUDED.is_ai_enabled,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    agent_schema = EXCLUDED.agent_schema;

-- ── Realistic Seed Orders ────────────────────────────────────────────────────
INSERT INTO orders (
    id, store_id, razorpay_order_id, razorpay_payment_id, order_id,
    x402_tx_hash, mandate_id, amount, original_price, discount_applied,
    customer_name, customer_phone, product_title, sku, currency, status, created_at
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'order_rzp_live_101', 'pay_rzp_live_101_succ', 'ORD-1042',
    'x402_a1b2c3d4e5f601', 'mnd_8823a9b1', 3799.00, 3999.00, 200.00,
    'Rahul Sharma', '+91 98765 43210', 'Nike Air Zoom Pegasus 41 (Running Shoes)', 'SKU-SHOE-001', 'INR', 'CAPTURED', NOW() - INTERVAL '12 minutes'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'order_rzp_live_102', 'pay_rzp_live_102_succ', 'ORD-1041',
    'x402_a1b2c3d4e5f602', 'mnd_7719b2c3', 5199.00, 5499.00, 300.00,
    'Priya Sundaram', '+91 98223 99881', 'Adidas Ultraboost Light Running Shoes', 'SKU-UB-001', 'INR', 'CAPTURED', NOW() - INTERVAL '48 minutes'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'order_rzp_live_103', 'pay_rzp_live_103_succ', 'ORD-1040',
    'x402_a1b2c3d4e5f603', 'mnd_6612c3d4', 3999.00, 4299.00, 300.00,
    'Ananya Iyer', '+91 97110 54321', 'Puma Velocity Nitro 3', 'SKU-PUMA-001', 'INR', 'CAPTURED', NOW() - INTERVAL '2 hours'
),
(
    'd0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'order_rzp_live_104', 'pay_rzp_live_104_succ', 'ORD-1039',
    'x402_a1b2c3d4e5f604', 'mnd_5503d4e5', 449.00, 499.00, 50.00,
    'Vikram Malhotra', '+91 98334 11223', 'RunFast Pro Sports Socks (Pack of 3)', 'SKU-SOCK-001', 'INR', 'CAPTURED', NOW() - INTERVAL '3 hours'
),
(
    'd0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'order_rzp_live_105', 'pay_rzp_live_105_succ', 'ORD-1038',
    'x402_a1b2c3d4e5f605', 'mnd_4492e5f6', 3699.00, 3999.00, 300.00,
    'Siddharth Menon', '+91 99001 88776', 'Nike Air Zoom Pegasus 41 (Running Shoes)', 'SKU-SHOE-001', 'INR', 'CAPTURED', NOW() - INTERVAL '5 hours'
),
(
    'd0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000002',
    'order_rzp_live_106', 'pay_rzp_live_106_succ', 'ORD-1037',
    'x402_a1b2c3d4e5f606', 'mnd_3381f6a7', 3899.00, 4199.00, 300.00,
    'Kavita Deshmukh', '+91 98450 77665', 'Nike Air Zoom Pegasus 41 (Running Shoes)', 'SKU-SHOE-002', 'INR', 'CAPTURED', NOW() - INTERVAL '7 hours'
)
ON CONFLICT (razorpay_order_id) DO NOTHING;

-- ── Realistic Seed Conversations ─────────────────────────────────────────────
INSERT INTO conversations (
    id, conversation_id, phone_number, customer_name,
    buyer_agent_id, session_state, status, deal_amount,
    products_discussed, last_message_id, context, created_at, updated_at
) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'conv_919876543210',
    '+91 98765 43210',
    'Rahul Sharma',
    'agent_buyer_rahul',
    'COMPLETE',
    'deal_closed',
    3799.00,
    '["Nike Air Zoom Pegasus 41 (Running Shoes)"]'::jsonb,
    'wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB' ,
    '{
        "transcript": [
            {"id":"m1","sender":"customer","content":"Hi! Do you have the Nike Air Zoom Pegasus in Size 10?","timestamp":"10:14 AM"},
            {"id":"m2","sender":"seller_agent","content":"Hey Rahul! 👋 Yes, we have 18 pairs of Nike Air Zoom Pegasus 41 (Size 10) in stock ready to ship today! Retail price is ₹3,999. Would you like me to reserve a pair for you?","timestamp":"10:14 AM"},
            {"id":"m3","sender":"customer","content":"Can you do ₹3,600 and ship today?","timestamp":"10:15 AM"},
            {"id":"m4","sender":"seller_agent","content":"I can offer you our exclusive flash deal: ₹3,799 with 100% Free Express Shipping! (That saves you ₹200 + ₹150 delivery). Here is your instant Razorpay UPI checkout link:","timestamp":"10:15 AM","metadata":{"isPaymentLink":true,"offerAmount":3799,"paymentLinkId":"plink_K9x182749a"}},
            {"id":"m5","sender":"customer","content":"Awesome! Just paid via UPI.","timestamp":"10:16 AM"},
            {"id":"m6","sender":"seller_agent","content":"Payment verified! Order #ORD-1042 confirmed. Tracking link will be sent via WhatsApp. Thank you for shopping with RunFast Sports! 🏃💨","timestamp":"10:16 AM"}
        ],
        "traces": [
            {"id":"t1","title":"Intent Parsed: Product Search & Stock Check","detail":"Extracted entity SKU-SHOE-001 (Nike Pegasus 41, UK 10). Live database confirmed 18 units AVAILABLE.","status":"completed","timestamp":"10:14:02 AM","durationMs":24},
            {"id":"t2","title":"Buyer Offer Evaluation","detail":"Customer offered ₹3,600 (9.9% discount). Store mandate ceiling is 12% (Floor price ₹3,500). Proposal is within safe parameters.","status":"completed","timestamp":"10:15:08 AM","durationMs":38},
            {"id":"t3","title":"Counter-Offer Formulated","detail":"Formulated strategic counter of ₹3,799 (+Free Shipping). Margin preserved: ₹299 above floor price. Customer saved ₹200.","status":"completed","timestamp":"10:15:10 AM","durationMs":142},
            {"id":"t4","title":"Distributed Inventory Lock Acquired","detail":"Redis key `lock:inventory:store_a:mock-var-001` acquired (TTL 120s). Postgres state updated to PAYMENT_PENDING.","status":"completed","timestamp":"10:15:11 AM","durationMs":12},
            {"id":"t5","title":"Razorpay Payment Link Generated","detail":"Created Razorpay Order & Standard UPI Payment Link for ₹3,799. x402 transaction signed.","status":"completed","timestamp":"10:15:12 AM","durationMs":310},
            {"id":"t6","title":"Settlement Captured & Audit Ledger Written","detail":"Payment verified via webhook HMAC. Inventory state set to PAID. SHA256 checksum audit record written.","status":"completed","timestamp":"10:16:04 AM","durationMs":45}
        ]
    }'::jsonb,
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '12 minutes'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'conv_919822399881',
    '+91 98223 99881',
    'Priya Sundaram',
    'agent_buyer_priya',
    'COMPLETE',
    'deal_closed',
    5199.00,
    '["Adidas Ultraboost Light Running Shoes"]'::jsonb,
    'wamid.HBgLOTE5ODIyMzk5ODgxFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB',
    '{
        "transcript": [
            {"id":"m1","sender":"customer","content":"Looking for Ultraboost Light in UK 9. Best price?","timestamp":"09:30 AM"},
            {"id":"m2","sender":"seller_agent","content":"Hello Priya! We have 6 units of Adidas Ultraboost Light in UK 9. Listed at ₹5,499. As a runner special, I can do ₹5,199 including free expedited shipping!","timestamp":"09:30 AM","metadata":{"isPaymentLink":true,"offerAmount":5199,"paymentLinkId":"plink_UB99281a"}},
            {"id":"m3","sender":"customer","content":"Paid! Thanks for the fast deal.","timestamp":"09:32 AM"}
        ],
        "traces": [
            {"id":"t1","title":"Product Lookup","detail":"SKU-UB-001 verified in Postgres. Inventory: 6. Floor: ₹4,800.","status":"completed","timestamp":"09:30:02 AM","durationMs":28},
            {"id":"t2","title":"Concession Calculation","detail":"Offered ₹5,199 (5.4% discount, well within 12% max). Margin preserved: ₹399.","status":"completed","timestamp":"09:30:04 AM","durationMs":85},
            {"id":"t3","title":"Payment Captured","detail":"Order #ORD-1041 settled instantly via Razorpay UPI.","status":"completed","timestamp":"09:32:15 AM","durationMs":32}
        ]
    }'::jsonb,
    NOW() - INTERVAL '55 minutes',
    NOW() - INTERVAL '48 minutes'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'conv_919711054321',
    '+91 97110 54321',
    'Ananya Iyer',
    'agent_buyer_ananya',
    'COMPLETE',
    'deal_closed',
    3999.00,
    '["Puma Velocity Nitro 3"]'::jsonb,
    'wamid.HBgLOTE5NzExMDU0MzIxFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB',
    '{
        "transcript": [
            {"id":"m1","sender":"customer","content":"Is Puma Velocity Nitro 3 good for half marathons?","timestamp":"08:15 AM"},
            {"id":"m2","sender":"seller_agent","content":"Yes absolutely! The Nitro foam delivers exceptional responsiveness for 21K distances. We have UK 8 in stock at ₹4,299. I can offer it to you for ₹3,999 today!","timestamp":"08:16 AM","metadata":{"isPaymentLink":true,"offerAmount":3999,"paymentLinkId":"plink_PM39921"}}
        ],
        "traces": [
            {"id":"t1","title":"Product Recommendation","detail":"Matched marathon query to Puma Velocity Nitro 3. Checked stock (14 available).","status":"completed","timestamp":"08:15:30 AM","durationMs":110},
            {"id":"t2","title":"Offer Created","detail":"Generated ₹3,999 price point. Razorpay checkout link dispatched.","status":"completed","timestamp":"08:16:01 AM","durationMs":210}
        ]
    }'::jsonb,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (conversation_id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    session_state = EXCLUDED.session_state,
    status = EXCLUDED.status,
    deal_amount = EXCLUDED.deal_amount,
    products_discussed = EXCLUDED.products_discussed,
    context = EXCLUDED.context;

-- ── Realistic Audit Ledger Events ───────────────────────────────────────────
INSERT INTO audit_ledger (
    event_type, whatsapp_message_id, conversation_id,
    x402_transaction_id, razorpay_payment_id, order_id,
    payload, event_checksum, timestamp
) VALUES
(
    'PAYMENT_CAPTURED',
    'wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB',
    'conv_919876543210',
    'x402_a1b2c3d4e5f601',
    'pay_rzp_live_101_succ',
    'ORD-1042',
    '{"amount":379900,"currency":"INR","method":"upi","vpa":"rahul@okhdfcbank","storeId":"a0000000-0000-0000-0000-000000000001"}'::jsonb,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    NOW() - INTERVAL '12 minutes'
),
(
    'INVENTORY_LOCKED',
    'wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB',
    'conv_919876543210',
    'x402_a1b2c3d4e5f601',
    NULL,
    'ORD-1042',
    '{"sku":"SKU-SHOE-001","storeId":"a0000000-0000-0000-0000-000000000001","agreedPrice":3799,"ttlSeconds":120}'::jsonb,
    'f1b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866',
    NOW() - INTERVAL '13 minutes'
),
(
    'NEGOTIATION_COMPLETED',
    'wamid.HBgLOTE5ODc2NTQzMjEwFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB',
    'conv_919876543210',
    'x402_a1b2c3d4e5f601',
    NULL,
    NULL,
    '{"product":"Nike Air Zoom Pegasus 41","listedPrice":3999,"agreedPrice":3799,"discountPercent":5.0,"marginPreserved":299}'::jsonb,
    'a2b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b877',
    NOW() - INTERVAL '14 minutes'
),
(
    'PAYMENT_CAPTURED',
    'wamid.HBgLOTE5ODIyMzk5ODgxFQIAEhggNzY5QzRDMTJGM0Q2NUE5MEVB',
    'conv_919822399881',
    'x402_a1b2c3d4e5f602',
    'pay_rzp_live_102_succ',
    'ORD-1041',
    '{"amount":519900,"currency":"INR","method":"upi","vpa":"priya@okaxis","storeId":"a0000000-0000-0000-0000-000000000001"}'::jsonb,
    'b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b888',
    NOW() - INTERVAL '48 minutes'
),
(
    'INVENTORY_UPDATED',
    NULL,
    NULL,
    'x402_system_sync_001',
    NULL,
    NULL,
    '{"sku":"SKU-UB-001","previousStock":7,"newStock":6,"reason":"ORDER_FULFILLED"}'::jsonb,
    'c4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899',
    NOW() - INTERVAL '49 minutes'
);
