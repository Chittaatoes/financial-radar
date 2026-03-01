import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// ✅ SERVERLESS SAFE POOL CONFIG
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  // 🔥 penting untuk Vercel
  max: 1, // hanya 1 connection per instance
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });