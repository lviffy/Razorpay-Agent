import "dotenv/config";
import { db } from "./client.ts";

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

    await client.query(`
      INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers, risk_profile, human_approval_above)
      VALUES ($1, 10.00, 2000.00, 5000.00, true, 'conservative', 10000.00);
    `, [store2Id]);

    const p3_schema = {
      variantId: "var_garmin_forerunner_55",
      title: "Garmin Forerunner 55 GPS Watch",
      sku: "GAR-FR55-BLK",
      listedPrice: 19990,
      floorPrice: 17990,
      inventoryAvailable: 5,
      attributes: { category: "Wearables", color: "Monochrome Black" }
    };
    await client.query(`
      INSERT INTO products (store_id, shopify_product_id, shopify_variant_id, title, sku, listed_price, floor_price, inventory_available, inventory_state, is_ai_enabled, category, description, agent_schema)
      VALUES ($1, 'prod_garmin_55', 'var_garmin_forerunner_55', 'Garmin Forerunner 55 GPS Watch', 'GAR-FR55-BLK', 19990.00, 17990.00, 5, 'AVAILABLE', true, 'Wearables', 'Easy-to-use GPS running smartwatch with wrist heart rate monitoring.', $2);
    `, [store2Id, JSON.stringify(p3_schema)]);

    console.log("✅ Demo stores & products seeded successfully!");
    return { store1Id, store2Id };
  } catch (err) {
    console.error("❌ Failed to seed demo data:", err);
    throw err;
  } finally {
    client.release();
  }
}

const isMain = process.argv[1]?.endsWith("seed-demo.ts");
if (isMain) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
