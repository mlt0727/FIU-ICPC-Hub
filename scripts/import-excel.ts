// Reads the volunteer roster Excel file and loads it into the database.
//
// Run with:  npm run db:import -- "path/to/Final Volunteer_Availability.xlsx"
// Re-run:    add --reset to replace all shifts (volunteers and tasks are updated in place).
//
// What it reads:
//   "Availability"        -> general volunteers with arrive / leave times
//   "Tech team"           -> tech volunteers with arrive / leave times (they have no task rows)
//   "Volunteers by Task"  -> one row per shift: Task | Volunteer | "8:00-11:00"
// It also merges:
//   data/corrections.json  fixes for known mistakes in the Excel file
//   data/all-hands.json    events everyone attends (Orientation), added by rule
//   data/task-details.json location + instructions per task
import ExcelJS from "exceljs";
import { readFile } from "node:fs/promises";
import { sql } from "../lib/db";
import { slugify } from "../lib/slug";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error('Usage: npm run db:import -- "path/to/file.xlsx" [--reset]');
  process.exit(1);
}

const EVENT_DATE = process.env.EVENT_DATE!; // e.g. 2026-11-07
const EVENT_TZ = process.env.EVENT_TZ!; // e.g. America/New_York
if (!EVENT_DATE || !EVENT_TZ) throw new Error("EVENT_DATE and EVENT_TZ must be set in .env.local");

// ---------- 1. Read the workbook ----------

type Person = { name: string; slug: string; team: "general" | "tech"; arrive: string; leave: string };
type Shift = { task: string; slug: string; start: string; end: string };

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(file);

function sheet(name: string) {
  const ws = workbook.getWorksheet(name);
  if (!ws) throw new Error(`Sheet "${name}" not found in ${file}`);
  return ws;
}

// Excel stores a time of day as a Date on 1899-12-30 (in UTC). We only want "HH:MM".
function cellTime(value: ExcelJS.CellValue): string | null {
  if (!(value instanceof Date)) return null;
  const h = String(value.getUTCHours()).padStart(2, "0");
  const m = String(value.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function cellText(value: ExcelJS.CellValue): string {
  return typeof value === "string" ? value.trim() : "";
}

// Rows whose Arrive column holds a time are people; the colour legend below them has no time.
function readPeople(sheetName: string, team: Person["team"]): Person[] {
  const people: Person[] = [];
  sheet(sheetName).eachRow((row) => {
    const name = cellText(row.getCell(1).value);
    const arrive = cellTime(row.getCell(2).value);
    const leave = cellTime(row.getCell(3).value);
    if (name && arrive && leave) people.push({ name, slug: slugify(name), team, arrive, leave });
  });
  return people;
}

const people = [...readPeople("Availability", "general"), ...readPeople("Tech team", "tech")];

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

type Corrections = {
  arrive: Record<string, string>; // name -> correct arrive time
  shiftTimes: { name: string; task: string; from: string; to: string }[];
};
const corrections = await readJson<Corrections>("../data/corrections.json");

// "LUNCH" -> "Lunch"; names that are not all capitals are kept as written.
function taskName(raw: string): string {
  return raw === raw.toUpperCase() ? raw[0] + raw.slice(1).toLowerCase() : raw;
}

const shifts: Shift[] = [];
sheet("Volunteers by Task").eachRow((row, rowNumber) => {
  const task = cellText(row.getCell(1).value);
  const name = cellText(row.getCell(2).value);
  const time = cellText(row.getCell(3).value);
  // Skip the header, blank rows and the "Registration: 7" count rows.
  const match = time.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (rowNumber === 1 || !task || !name || !match) return;
  const pad = (t: string) => t.padStart(5, "0"); // "8:00" -> "08:00"
  shifts.push({ task: taskName(task), slug: slugify(name), start: pad(match[1]), end: pad(match[2]) });
});

// Apply corrections.json. A correction that matches nothing is a problem: the Excel file probably changed.
const correctionProblems: string[] = [];
for (const [name, arrive] of Object.entries(corrections.arrive)) {
  const p = people.find((x) => x.name === name);
  if (p) p.arrive = arrive;
  else correctionProblems.push(`corrections.json: no person named "${name}"`);
}
for (const c of corrections.shiftTimes) {
  const [fromStart, fromEnd] = c.from.split("-");
  const s = shifts.find(
    (x) => x.slug === slugify(c.name) && x.task === c.task && x.start === fromStart && x.end === fromEnd,
  );
  if (s) [s.start, s.end] = c.to.split("-");
  else correctionProblems.push(`corrections.json: no ${c.task} ${c.from} shift for "${c.name}"`);
}

// Add all-hands events for every general volunteer who is on site early enough.
type AllHands = { task: string; start: string; end: string; forArrivalsBefore: string };
const allHands = await readJson<AllHands[]>("../data/all-hands.json");
for (const event of allHands) {
  for (const p of people) {
    if (p.team === "general" && p.arrive < event.forArrivalsBefore) {
      shifts.push({ task: event.task, slug: p.slug, start: event.start, end: event.end });
    }
  }
}

// ---------- 2. Check the data before touching the database ----------

const bySlug = new Map(people.map((p) => [p.slug, p]));
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const problems: string[] = [...correctionProblems];
const warnings: string[] = [];

if (bySlug.size !== people.length) problems.push("Two people in the roster turn into the same URL slug.");

for (const s of shifts) {
  const p = bySlug.get(s.slug);
  if (!p) {
    problems.push(`Shift for unknown volunteer "${s.slug}" (${s.task} ${s.start}-${s.end})`);
  } else if (toMinutes(s.start) < toMinutes(p.arrive) || toMinutes(s.end) > toMinutes(p.leave)) {
    warnings.push(`${p.name}: ${s.task} ${s.start}-${s.end} is outside their availability ${p.arrive}-${p.leave}`);
  }
}

for (const p of people) {
  const mine = shifts
    .filter((s) => s.slug === p.slug)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  if (p.team === "tech") continue; // the tech team has its own plan; only their hours are shown
  if (mine.length === 0) {
    warnings.push(`${p.name} has no tasks`);
    continue;
  }
  // Walk through the day: report overlaps and unassigned time while they are on site.
  let cursor = p.arrive; // latest end time seen so far
  mine.forEach((s, i) => {
    if (toMinutes(s.start) > toMinutes(cursor)) warnings.push(`${p.name}: nothing assigned ${cursor}-${s.start}`);
    if (i > 0 && toMinutes(s.start) < toMinutes(cursor))
      warnings.push(`${p.name}: ${s.task} ${s.start}-${s.end} overlaps an earlier task`);
    if (toMinutes(s.end) > toMinutes(cursor)) cursor = s.end;
  });
  if (toMinutes(cursor) < toMinutes(p.leave)) warnings.push(`${p.name}: nothing assigned ${cursor}-${p.leave}`);
}

const taskNames = [...new Set(shifts.map((s) => s.task))];
console.log(`Read ${people.length} people, ${taskNames.length} tasks, ${shifts.length} shifts.`);
if (warnings.length) console.log(`\nWarnings (imported anyway, check with the organizers):\n  ${warnings.join("\n  ")}`);
if (problems.length) {
  console.error(`\nProblems (nothing was imported):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

// ---------- 3. Write to the database ----------

type TaskDetail = { location?: string; instructions?: string };
const details = await readJson<Record<string, TaskDetail>>("../data/task-details.json");
const BREAKS = new Set(["Lunch", "Dinner"]);
const MEETINGS = new Set(allHands.map((e) => e.task));
const kindOf = (name: string) => (BREAKS.has(name) ? "break" : MEETINGS.has(name) ? "meeting" : "duty");

const [{ count }] = (await sql`select count(*)::int as count from shifts`) as { count: number }[];
if (count > 0 && !reset) {
  console.error(`\nThe database already has ${count} shifts. Re-run with --reset to replace them.`);
  process.exit(1);
}

// "08:00" on EVENT_DATE in EVENT_TZ -> an exact moment in time (timestamptz).
const at = (time: string) => sql`((${EVENT_DATE}::date + ${time}::time) at time zone ${EVENT_TZ})`;

// All statements run in one transaction: either everything is imported or nothing is.
await sql.transaction([
  sql`delete from shifts`,
  ...people.map(
    (p) => sql`
      insert into volunteers (slug, name, team, arrive_at, leave_at)
      values (${p.slug}, ${p.name}, ${p.team}, ${at(p.arrive)}, ${at(p.leave)})
      on conflict (slug) do update
        set name = excluded.name, team = excluded.team,
            arrive_at = excluded.arrive_at, leave_at = excluded.leave_at`,
  ),
  ...taskNames.map((name) => {
    const d = details[name] ?? {};
    // Empty values in the JSON never overwrite text typed on the admin page.
    return sql`
      insert into tasks (name, kind, location, instructions)
      values (${name}, ${kindOf(name)}, ${d.location || null}, ${d.instructions || null})
      on conflict (name) do update
        set kind = excluded.kind,
            location = coalesce(excluded.location, tasks.location),
            instructions = coalesce(excluded.instructions, tasks.instructions)`;
  }),
  ...shifts.map(
    (s) => sql`
      insert into shifts (volunteer_id, task_id, starts_at, ends_at)
      select v.id, t.id, ${at(s.start)}, ${at(s.end)}
      from volunteers v, tasks t
      where v.slug = ${s.slug} and t.name = ${s.task}`,
  ),
]);

console.log(`\nImported into the database (event day ${EVENT_DATE}, ${EVENT_TZ}).`);
