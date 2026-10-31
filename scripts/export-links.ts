// Writes volunteer-links.csv: every volunteer's personal link, ready to send out.
// Run with: npm run links
// The file has the roster's names in it, so it is kept out of git (see .gitignore), like the Excel file.
import { writeFile } from "node:fs/promises";
import { sql } from "../lib/db";
import { formatTime } from "../lib/time";

const SITE = process.env.SITE_URL ?? "https://fiu-icpc-hub.vercel.app";

const rows = await sql`
  select slug, name, team, arrive_at, leave_at from volunteers order by team, name`;

// Wrap every field in quotes so names with commas or quotes stay in one column.
const field = (value: string) => `"${value.replaceAll('"', '""')}"`;
const time = (value: unknown) => (value ? formatTime(new Date(value as string).toISOString()) : "");

const lines = [
  ["Name", "Team", "Link", "Arrive", "Leave"],
  ...rows.map((r) => [r.name, r.team, `${SITE}/${r.slug}`, time(r.arrive_at), time(r.leave_at)]),
].map((cells) => cells.map(field).join(","));

// "﻿" at the start tells Excel the file is UTF-8, so "González" doesn't turn into garbage.
try {
  await writeFile("volunteer-links.csv", "﻿" + lines.join("\r\n") + "\r\n", "utf8");
} catch (error) {
  // Windows locks a file while Excel has it open, so it can't be overwritten.
  if ((error as { code?: string }).code === "EBUSY") {
    console.error("volunteer-links.csv is open in Excel. Close it there, then run `npm run links` again.");
    process.exit(1);
  }
  throw error;
}
console.log(`Wrote ${rows.length} links to volunteer-links.csv`);
