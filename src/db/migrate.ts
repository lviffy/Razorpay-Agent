import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Neon DB client — used everywhere in the app
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ─────────────────────────────────────────────────────────────────────────────
// Migration — idempotent, safe to run on every boot
// ─────────────────────────────────────────────────────────────────────────────

async function migrate() {
  const client = await db.connect();

  try {
    console.log("🔄 Running schema migration...");
    const schema = readFileSync(
      join(import.meta.dir, "schema.sql"),
      "utf-8"
    );
    await client.query(schema);

    // Apply incremental column updates if tables existed previously
    await client.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '+91 98765 00000';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT 'merchant@runfastsports.in';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS role VARCHAR(100) DEFAULT 'Store Owner & Admin';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS agent_settings JSONB DEFAULT '{"name":"RunFast AI Seller","tone":"friendly","status":"active","autoNegotiationEnabled":true,"humanEscalationEnabled":true,"escalationThresholdAmount":5000}'::jsonb;

      ALTER TABLE negotiation_rules ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(50) DEFAULT 'balanced';
      ALTER TABLE negotiation_rules ADD COLUMN IF NOT EXISTS human_approval_above NUMERIC(12,2) DEFAULT 5000.00;
      ALTER TABLE negotiation_rules ADD COLUMN IF NOT EXISTS alternative_products_enabled BOOLEAN DEFAULT true;

      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT true;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT 'Aarav Patel';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) DEFAULT '+91 98765 43210';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_title VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_applied NUMERIC(12,2) DEFAULT 0;

      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT 'Aarav Patel';
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deal_amount NUMERIC(12,2);
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS products_discussed JSONB DEFAULT '[]'::jsonb;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'credentials';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);

    console.log("✅ Schema applied and verified");

    // Always ensure rich seed data is applied / refreshed
    console.log("🌱 Applying / refreshing seed data...");
    const seed = readFileSync(
      join(import.meta.dir, "seed.sql"),
      "utf-8"
    );
    await client.query(seed);
    console.log("✅ Seed data populated & up to date");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Run migration when this file is executed directly: bun src/db/migrate.ts
// Also exported so src/index.ts can call it on startup
export { migrate };

// Auto-run if invoked directly
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
