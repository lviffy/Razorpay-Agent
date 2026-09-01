import { db } from "@zapai/database";

async function main() {
  const { rows: tables } = await db.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log("Tables found:", tables.map(t => t.tablename));

  // TRUNCATE everything in one shot, cascading FK references
  const names = tables.map(t => `"${t.tablename}"`).join(", ");
  if (names) {
    await db.query(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
    console.log("✅ All tables wiped.");
  } else {
    console.log("No tables found — nothing to wipe.");
  }

  process.exit(0);
}

main().catch(e => {
  console.error("❌ Wipe failed:", e.message);
  process.exit(1);
});
