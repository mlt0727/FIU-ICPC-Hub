import { sql } from "@/lib/db";
import { parseSubscription } from "@/lib/push-subscription";

// POST /api/push/subscribe  { slug, subscription }
// Saves "this phone wants notifications for this volunteer". Saving the same phone again just updates it.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sub = parseSubscription(body?.subscription);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!sub || !/^[a-z0-9-]{1,100}$/.test(slug)) return Response.json({ error: "Bad request" }, { status: 400 });

  const rows = await sql`
    insert into push_subscriptions (volunteer_id, endpoint, p256dh, auth)
    select id, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth} from volunteers where slug = ${slug}
    on conflict (endpoint) do update
      set volunteer_id = excluded.volunteer_id, p256dh = excluded.p256dh, auth = excluded.auth
    returning id`;
  if (rows.length === 0) return Response.json({ error: "Unknown volunteer" }, { status: 404 });
  return Response.json({ ok: true });
}
