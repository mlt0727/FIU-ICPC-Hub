import { neon } from "@neondatabase/serverless";

// The one place that knows how to reach the database.
// `neon()` talks to Neon over HTTPS, which works both in scripts and on Vercel.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

export const sql = neon(url);
