import { sql } from "@/lib/db";
import { formatTime } from "@/lib/time";

// The latest announcements, shown at the top of volunteer pages and the general page.
// Push notifications can be missed (Focus mode, phone off), so the page always shows them too.
export async function Announcements() {
  const rows = await sql`select title, body, created_at from announcements order by created_at desc limit 3`;
  if (rows.length === 0) return null;
  return (
    <section className="announcements" aria-label="Announcements">
      {rows.map((a, i) => (
        <article key={i} className="announcement">
          <p className="card-time">{formatTime(new Date(a.created_at).toISOString())} · Announcement</p>
          <h2 className="card-name">{a.title}</h2>
          <p className="announcement-body">{a.body}</p>
        </article>
      ))}
    </section>
  );
}
