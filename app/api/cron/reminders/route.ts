import { sql } from "@/lib/db";
import { sendPush } from "@/lib/push";
import { formatTime, REMINDER_MINUTES } from "@/lib/time";

// GET /api/cron/reminders — cron-job.org calls this every minute with "Authorization: Bearer <CRON_SECRET>".
// Sends "task starts soon" pushes for every shift starting in the next REMINDER_MINUTES minutes.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Claim the due shifts and mark them in one statement. If two calls overlap, each shift is still
  // claimed by only one of them, so nobody gets the same reminder twice.
  // Shifts that already started are skipped: a late "starts soon" message is worse than none.
  const due = await sql`
    update shifts s set reminder_sent_at = now()
    from tasks t, volunteers v
    where t.id = s.task_id and v.id = s.volunteer_id
      and s.reminder_sent_at is null
      and s.starts_at > now()
      and s.starts_at <= now() + make_interval(mins => ${REMINDER_MINUTES})
    returning s.volunteer_id, s.starts_at, t.name as task, t.location, v.slug`;
  if (due.length === 0) return Response.json({ shifts: 0, sent: 0 });

  const subs = await sql`
    select volunteer_id, endpoint, p256dh, auth from push_subscriptions
    where volunteer_id = any(${due.map((d) => d.volunteer_id)})`;

  const sends = due.flatMap((d) => {
    const startsAt = new Date(d.starts_at);
    const message = {
      title: `${d.task} at ${formatTime(startsAt.toISOString())}`,
      body: d.location ? `Starts soon · ${d.location}` : "Starts soon",
      url: `/${d.slug}`,
    };
    // Drop the message if it can't be delivered before the task starts.
    const ttl = Math.max(60, Math.round((startsAt.getTime() - Date.now()) / 1000));
    return subs
      .filter((s) => s.volunteer_id === d.volunteer_id)
      .map((s) => sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, message, ttl));
  });
  const results = await Promise.all(sends);

  return Response.json({ shifts: due.length, sent: results.filter(Boolean).length, failed: results.filter((ok) => !ok).length });
}
