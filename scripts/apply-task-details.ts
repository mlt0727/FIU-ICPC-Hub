// Copies data/task-details.json (location + instructions per task) into the database.
// Run with: npm run db:details   — safe to run any number of times.
// Empty values in the JSON are skipped, so they never erase text typed on the admin page.
//
// "byPerson" (optional) sends different people on the same task to different places:
//   "Print Running": { "location": "Room 105 or 106", "byPerson": { "Room 105": ["Name", ...], "Room 106": [...] } }
// Names must match the roster exactly. Run this again after `npm run db:import -- ... --reset`,
// because the import recreates all shifts.
import { readFile } from "node:fs/promises";
import { sql } from "../lib/db";

type TaskDetail = { location?: string; instructions?: string; byPerson?: Record<string, string[]> };
const details: Record<string, TaskDetail> = JSON.parse(
  await readFile(new URL("../data/task-details.json", import.meta.url), "utf8"),
);

const knownTasks = new Set((await sql`select name from tasks`).map((r) => r.name as string));
const knownPeople = new Set((await sql`select name from volunteers`).map((r) => r.name as string));
let tasks = 0;
let shifts = 0;

for (const [name, d] of Object.entries(details)) {
  if (!knownTasks.has(name)) {
    console.warn(`Skipped "${name}": no task with this exact name in the database.`);
    continue;
  }
  if (d.location || d.instructions) {
    await sql`
      update tasks set
        location = coalesce(${d.location || null}, location),
        instructions = coalesce(${d.instructions || null}, instructions)
      where name = ${name}`;
    tasks++;
  }
  for (const [place, people] of Object.entries(d.byPerson ?? {})) {
    for (const person of people.filter((p) => !knownPeople.has(p))) {
      console.warn(`"${name}" → "${place}": no volunteer named "${person}".`);
    }
    const rows = await sql`
      update shifts s set location = ${place}
      from tasks t, volunteers v
      where t.id = s.task_id and v.id = s.volunteer_id and t.name = ${name} and v.name = any(${people})
      returning s.id`;
    shifts += rows.length;
  }
}
console.log(`Updated ${tasks} task(s) and ${shifts} per-person shift location(s).`);
