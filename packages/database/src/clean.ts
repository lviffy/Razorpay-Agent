import "dotenv/config";
import { db } from "./client.ts";

async function cleanDB() {
  const client = await db.connect();
  try {
    console.log("🧹 Cleaning all tables in Neon DB...");
    await client.query(`
      TRUNCATE TABLE 
        audit_ledger,
        orders,
        negotiation_sessions,
        conversations,
        processed_webhook_events,
        mandates,
        products,
        negotiation_rules,
        sessions,
        users,
        stores
      CASCADE;
    `);
    console.log("✅ Database tables successfully cleaned!");
  } catch (err) {
    console.error("❌ Failed to clean database:", err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

cleanDB();
