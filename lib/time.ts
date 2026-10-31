// Turns exact moments into the 12-hour local times people read on the page.
// All formatting happens on the server, in the event's time zone, so a phone set to another zone still sees New York time.
const TZ = process.env.EVENT_TZ ?? "America/New_York";

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

// "2026-11-07T13:00:00Z" -> "8:00 AM"
export function formatTime(isoTime: string): string {
  return clock.format(new Date(isoTime));
}

// "8:00 – 10:00 AM" when both ends share AM/PM, otherwise "11:00 AM – 12:00 PM".
export function formatRange(start: string, end: string): string {
  const a = formatTime(start);
  const b = formatTime(end);
  const sameHalf = a.slice(-2) === b.slice(-2);
  return `${sameHalf ? a.slice(0, -3) : a} – ${b}`;
}

// 7 -> "7 hours", 13.5 -> "13.5 hours", 1 -> "1 hour"
export function formatHours(start: string, end: string): string {
  const hours = Math.round(((Date.parse(end) - Date.parse(start)) / 3_600_000) * 10) / 10;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

// EVENT_DATE "2026-11-07" -> "Sat, Nov 7"
export function formatEventDay(): string {
  const day = new Date(`${process.env.EVENT_DATE ?? "2026-11-07"}T12:00:00Z`);
  return day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

// How long before a task starts its reminder is sent. Shown in the page text too, so change it only here.
export const REMINDER_MINUTES = 10;
