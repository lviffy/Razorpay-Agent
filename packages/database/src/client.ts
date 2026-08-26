import "dotenv/config";
import { Pool } from "pg";

// ─────────────────────────────────────────────────────────────────────────────
// Neon DB client — Postgres connection pool
// ─────────────────────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL || "";

export const db = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
