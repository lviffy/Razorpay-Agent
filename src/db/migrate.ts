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
    console.log("✅ Schema applied");

    // Check if seed data already exists
    const { rows } = await client.query(
      "SELECT COUNT(*) as count FROM stores"
    );
    const count = parseInt(rows[0].count, 10);

    if (count === 0) {
      console.log("🌱 Seeding mock merchant data...");
      const seed = readFileSync(
        join(import.meta.dir, "seed.sql"),
        "utf-8"
      );
      await client.query(seed);
      console.log("✅ Seed data inserted (2 merchants, 4 products)");
    } else {
      console.log(`ℹ️  Seed data already present (${count} stores) — skipping`);
    }
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
