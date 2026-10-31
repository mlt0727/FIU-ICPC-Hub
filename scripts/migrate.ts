// Creates the tables described in db/schema.sql.
// Run with: npm run db:migrate
import { readFile } from "node:fs/promises";
import { sql } from "../lib/db";

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

// The HTTP driver runs one statement per call, so split the file on ";" at the end of a line.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.replace(/--.*$/gm, "").trim()) // remove comments
  .filter((s) => s.length > 0);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} statements from db/schema.sql`);
