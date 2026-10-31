// Quick self-check for lib/time.ts. Run with: npx tsx scripts/check-time.ts
import assert from "node:assert/strict";
import { eventTimeIso, formatRange, toInputTime } from "../lib/time";

process.env.EVENT_DATE ??= "2026-11-07";
// Nov 7, 2026 is after daylight saving ends, so New York is UTC-5: 8:00 AM = 13:00 UTC.
assert.equal(eventTimeIso("08:00"), "2026-11-07T13:00:00.000Z");
assert.equal(eventTimeIso("19:30"), "2026-11-08T00:30:00.000Z");
assert.equal(toInputTime(eventTimeIso("13:30")), "13:30");
assert.equal(formatRange(eventTimeIso("11:00"), eventTimeIso("12:00")).replace(/\s/g, " "), "11:00 AM – 12:00 PM");
console.log("time checks passed");
