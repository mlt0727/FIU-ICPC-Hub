import { sql } from "@/lib/db";
import { type Message, sendPush } from "@/lib/push";
import { CHECK_IN_LOCATION } from "@/lib/rooms";
import { formatTime, REMINDER_MINUTES } from "@/lib/time";

// GET /api/cron/reminders — cron-job.org calls this every minute with "Authorization: Bearer <CRON_SECRET>".
// Sends two kinds of "coming up" pushes, each REMINDER_MINUTES minutes ahead:
//   1. "Check in at 12:00 PM" for everyone about to arrive (everyone checks in at Room 112 first);
//   2. "Lunch at 12:00 PM" for every shift about to start.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each query claims what is due and marks it in the same statement. If two calls overlap, each
  // reminder is still claimed by only one of them, so nobody gets the same reminder twice.
  // Things that already started are skipped: a late "starts soon" message is worse than none.
  const arrivals = await sql`
    update volunteers set checkin_reminder_sent_at = now()
    where checkin_reminder_sent_at is null
      and arrive_at > now()
      and arrive_at <= now() + make_interval(mins => ${REMINDER_MINUTES})
    returning id as volunteer_id, slug, arrive_at as starts_at`;
  const shifts = await sql`
    update shifts s set reminder_sent_at = now()
    from tasks t, volunteers v
    where t.id = s.task_id and v.id = s.volunteer_id
      and s.reminder_sent_at is null
      and s.starts_at > now()
      and s.starts_at <= now() + make_interval(mins => ${REMINDER_MINUTES})
    returning s.volunteer_id, s.starts_at, t.name as task, coalesce(s.location, t.location) as location, v.slug`;

  // Check-ins go out first, so on the phone "Check in" arrives before "Lunch at 12:00 PM".
  const checkIns = await sendAll(arrivals, (a) => ({
    title: `Check in at ${formatTime(new Date(a.starts_at).toISOString())}`,
    body: `Go to ${CHECK_IN_LOCATION} first, before anything else`,
    url: `/${a.slug}`,
  }));
  const tasks = await sendAll(shifts, (d) => ({
    title: `${d.task} at ${formatTime(new Date(d.starts_at).toISOString())}`,
    body: d.location ? `Starts soon · ${d.location}` : "Starts soon",
    url: `/${d.slug}`,
  }));

  return Response.json({
    checkIns: arrivals.length,
    shifts: shifts.length,
    sent: checkIns.sent + tasks.sent,
    failed: checkIns.failed + tasks.failed,
  });
}

type Due = Record<string, any>; // a row from one of the queries above: volunteer_id, slug, starts_at, ...

// Sends one message per due row to every phone of that volunteer (someone may have two devices).
async function sendAll(rows: Due[], message: (row: Due) => Message) {
  if (rows.length === 0) return { sent: 0, failed: 0 };
  const subs = await sql`
    select volunteer_id, endpoint, p256dh, auth from push_subscriptions
    where volunteer_id = any(${rows.map((r) => r.volunteer_id)})`;
  const results = await Promise.all(
    rows.flatMap((row) => {
      // Drop the message if it can't be delivered before the thing starts.
      const ttl = Math.max(60, Math.round((new Date(row.starts_at).getTime() - Date.now()) / 1000));
      return subs
        .filter((s) => s.volunteer_id === row.volunteer_id)
        .map((s) => sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, message(row), ttl));
    }),
  );
  return { sent: results.filter(Boolean).length, failed: results.filter((ok) => !ok).length };
}
