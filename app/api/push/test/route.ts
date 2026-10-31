import { sql } from "@/lib/db";
import { sendPush } from "@/lib/push";
import { REMINDER_MINUTES } from "@/lib/time";

// POST /api/push/test  { endpoint }
// Sends a test notification to this one phone. Only a phone that is already saved can be targeted,
// and only the phone itself knows its endpoint, so nobody can use this to message other people.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const [sub] = await sql`
    select s.endpoint, s.p256dh, s.auth, v.slug
    from push_subscriptions s join volunteers v on v.id = s.volunteer_id
    where s.endpoint = ${endpoint}`;
  if (!sub) return Response.json({ error: "Not subscribed" }, { status: 404 });

  const ok = await sendPush(
    { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
    { title: "Reminders are on", body: `This is a test. You'll get a message ${REMINDER_MINUTES} minutes before each task.`, url: `/${sub.slug}` },
    60,
  );
  return Response.json({ ok }, { status: ok ? 200 : 502 });
}
