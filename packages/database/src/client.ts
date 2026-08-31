import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

// Load local and workspace root .env
config();
config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(process.cwd(), ".env") });

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
