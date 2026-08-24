import "dotenv/config";
import { db } from "./migrate.ts";

export async function seedDemoData() {
  const client = await db.connect();
  try {
    console.log("🌱 Seeding demo stores, products, and negotiation rules...");

    // 1. Store 1: RunFast Sports (Mumbai)
    const store1Res = await client.query(`
      INSERT INTO stores (name, city, phone, email, role, razorpay_account_id, currency, is_active)
      VALUES ('RunFast Sports', 'Mumbai', '+91 98765 00001', 'mumbai@runfastsports.in', 'Store Owner & Admin', 'rzp_test_mumbai', 'INR', true)
      RETURNING id;
    `);
    const store1Id = store1Res.rows[0].id;

    // Rules for Store 1
    await client.query(`
      INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers, risk_profile, human_approval_above)
      VALUES ($1, 15.00, 1000.00, 4000.00, true, 'balanced', 6000.00);
    `, [store1Id]);

    // Products for Store 1
    const p1_schema = {
      variantId: "var_nike_pegasus_40",
      title: "Nike Air Zoom Pegasus 40",
      sku: "NIKE-PEG40-BLK",
      listedPrice: 4299,
      floorPrice: 3500,
      inventoryAvailable: 10,
      attributes: { category: "Running Shoes", size: "UK 9", color: "Black/Volt" }
    };
    await client.query(`
      INSERT INTO products (store_id, shopify_product_id, shopify_variant_id, title, sku, listed_price, floor_price, inventory_available, inventory_state, is_ai_enabled, category, description, agent_schema)
      VALUES ($1, 'prod_nike_pegasus', 'var_nike_pegasus_40', 'Nike Air Zoom Pegasus 40', 'NIKE-PEG40-BLK', 4299.00, 3500.00, 10, 'AVAILABLE', true, 'Running Shoes', 'Responsive workhorse with Air Zoom cushioning.', $2);
    `, [store1Id, JSON.stringify(p1_schema)]);

    const p2_schema = {
      variantId: "var_nike_socks_3pk",
      title: "Nike Dri-FIT Running Socks (3-Pack)",
      sku: "NIKE-SOCK-3PK",
      listedPrice: 399,
      floorPrice: 199,
      inventoryAvailable: 25,
      attributes: { category: "Accessories", size: "Free Size", color: "White" }
    };
    await client.query(`
      INSERT INTO products (store_id, shopify_product_id, shopify_variant_id, title, sku, listed_price, floor_price, inventory_available, inventory_state, is_ai_enabled, category, description, agent_schema)
      VALUES ($1, 'prod_nike_socks', 'var_nike_socks_3pk', 'Nike Dri-FIT Running Socks (3-Pack)', 'NIKE-SOCK-3PK', 399.00, 199.00, 25, 'AVAILABLE', true, 'Accessories', 'Anti-blister cushioned moisture-wicking socks.', $2);
    `, [store1Id, JSON.stringify(p2_schema)]);

    // 2. Store 2: Apex Athletics (Bengaluru)
    const store2Res = await client.query(`
      INSERT INTO stores (name, city, phone, email, role, razorpay_account_id, currency, is_active)
      VALUES ('Apex Athletics', 'Bengaluru', '+91 98765 00002', 'support@apexathletics.in', 'Store Owner & Admin', 'rzp_test_apex', 'INR', true)
      RETURNING id;
    `);
    const store2Id = store2Res.rows[0].id;

    // Rules for Store 2
    await client.query(`
      INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers, risk_profile, human_approval_above)
      VALUES ($1, 20.00, 1500.00, 4500.00, true, 'aggressive', 7000.00);
    `, [store2Id]);

    // Products for Store 2
    const p3_schema = {
      variantId: "var_adidas_ultraboost",
      title: "Adidas Ultraboost Light",
      sku: "ADI-UB-LGT-01",
      listedPrice: 4899,
      floorPrice: 3800,
      inventoryAvailable: 8,
      attributes: { category: "Running Shoes", size: "UK 9", color: "Cloud White" }
    };
    await client.query(`
      INSERT INTO products (store_id, shopify_product_id, shopify_variant_id, title, sku, listed_price, floor_price, inventory_available, inventory_state, is_ai_enabled, category, description, agent_schema)
      VALUES ($1, 'prod_adidas_ub', 'var_adidas_ultraboost', 'Adidas Ultraboost Light', 'ADI-UB-LGT-01', 4899.00, 3800.00, 8, 'AVAILABLE', true, 'Running Shoes', 'Epic energy return in lightweight Primeknit upper.', $2);
    `, [store2Id, JSON.stringify(p3_schema)]);

    const p4_schema = {
      variantId: "var_puma_velocity_2",
      title: "Puma Velocity Nitro 2",
      sku: "PUMA-NITRO-02",
      listedPrice: 3999,
      floorPrice: 3200,
      inventoryAvailable: 12,
      attributes: { category: "Running Shoes", size: "UK 9", color: "Puma Black" }
    };
    await client.query(`
      INSERT INTO products (store_id, shopify_product_id, shopify_variant_id, title, sku, listed_price, floor_price, inventory_available, inventory_state, is_ai_enabled, category, description, agent_schema)
      VALUES ($1, 'prod_puma_nitro', 'var_puma_velocity_2', 'Puma Velocity Nitro 2', 'PUMA-NITRO-02', 3999.00, 3200.00, 12, 'AVAILABLE', true, 'Running Shoes', 'All-distance running shoe with Nitro foam technology.', $2);
    `, [store2Id, JSON.stringify(p4_schema)]);

    console.log("✅ Seed data successfully inserted (2 stores, 4 products, 2 rule profiles)");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith("seed-demo.ts")) {
  seedDemoData().then(() => process.exit(0)).catch(() => process.exit(1));
}
