import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Migration — idempotent, safe to run on every boot
// ─────────────────────────────────────────────────────────────────────────────

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set — skipping database migration.");
    return;
  }

  const client = await db.connect();

  try {
    console.log("🔄 Running schema migration...");
    const schemaPath = join(import.meta.dir, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    await client.query(schema);

    // Apply incremental column updates if tables existed previously
    await client.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'Store Owner & Admin';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS agent_settings JSONB DEFAULT '{"name":"AI Seller Agent","tone":"friendly","status":"active","autoNegotiationEnabled":true,"humanEscalationEnabled":true,"escalationThresholdAmount":5000}'::jsonb;

      ALTER TABLE negotiation_rules ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(50) DEFAULT 'balanced';
      ALTER TABLE negotiation_rules ADD COLUMN IF NOT EXISTS human_approval_above NUMERIC(12,2) DEFAULT 0.00;
      ALTER TABLE negotiation_rules ADD COLUMN IF NOT EXISTS alternative_products_enabled BOOLEAN DEFAULT true;

      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT true;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE products ALTER COLUMN shopify_product_id DROP NOT NULL;
      ALTER TABLE products ALTER COLUMN shopify_variant_id DROP NOT NULL;
      ALTER TABLE products ALTER COLUMN agent_schema DROP NOT NULL;
      ALTER TABLE products ALTER COLUMN agent_schema SET DEFAULT '{}'::jsonb;

      ALTER TABLE stores ALTER COLUMN razorpay_account_id DROP NOT NULL;
      ALTER TABLE stores ALTER COLUMN razorpay_account_id SET DEFAULT 'rzp_test_mock';

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_title VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_applied NUMERIC(12,2) DEFAULT 0;

      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deal_amount NUMERIC(12,2);
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS products_discussed JSONB DEFAULT '[]'::jsonb;

      ALTER TABLE audit_ledger ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
      ALTER TABLE processed_webhook_events ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'credentials';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    `);

    console.log("✅ Schema applied and verified");

    if (process.env.SKIP_SEED !== "true") {
      const seedPath = join(import.meta.dir, "seed.sql");
      const seed = readFileSync(seedPath, "utf-8");
      if (seed.trim()) {
        await client.query(seed);
        console.log("✅ Seed data populated & up to date");
      }
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

export { migrate, db };

const isMain = process.argv[1]?.endsWith("migrate.ts");
if (isMain) {
  migrate()
    .then(() => {
      console.log("✅ Migration complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Migration error:", err);
      process.exit(1);
    });
}
