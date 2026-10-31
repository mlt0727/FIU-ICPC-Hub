// Copies data/task-details.json (location + instructions per task) into the database.
// Run with: npm run db:details   — safe to run any number of times; it never touches shifts.
// Empty values in the JSON are skipped, so they never erase text typed on the admin page.
import { readFile } from "node:fs/promises";
import { sql } from "../lib/db";

type TaskDetail = { location?: string; instructions?: string };
const details: Record<string, TaskDetail> = JSON.parse(
  await readFile(new URL("../data/task-details.json", import.meta.url), "utf8"),
);

const known = new Set((await sql`select name from tasks`).map((r) => r.name as string));
let updated = 0;
for (const [name, d] of Object.entries(details)) {
  if (!known.has(name)) {
    console.warn(`Skipped "${name}": no task with this exact name in the database.`);
    continue;
  }
  if (!d.location && !d.instructions) continue;
  await sql`
    update tasks set
      location = coalesce(${d.location || null}, location),
      instructions = coalesce(${d.instructions || null}, instructions)
    where name = ${name}`;
  updated++;
}
console.log(`Updated ${updated} task(s).`);
