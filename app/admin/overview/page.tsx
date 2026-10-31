import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { formatHours, formatRange, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "All data · Admin · FIU ICPC Hub", robots: { index: false } };

type Row = { slug: string; name: string; team: string; task: string; startsAt: string; endsAt: string; location: string | null };

// /admin/overview — everything in the database, laid out like the Excel sheets:
// "Volunteers by task" (who is on each task, and when) and "Tasks by volunteer" (each person's day).
// Read-only; tap a name to edit that person.
export default async function OverviewPage() {
  if (!(await isAdmin())) redirect("/admin");

  const iso = (d: unknown) => new Date(d as string).toISOString();
  const [shiftRows, people] = await Promise.all([
    sql`
      select v.slug, v.name, v.team, t.name as task, s.starts_at, s.ends_at, s.location
      from shifts s join tasks t on t.id = s.task_id join volunteers v on v.id = s.volunteer_id
      order by s.starts_at, t.name, v.name`,
    sql`select slug, name, team, arrive_at, leave_at from volunteers order by team, name`,
  ]);
  const rows: Row[] = shiftRows.map((r) => ({
    slug: r.slug,
    name: r.name,
    team: r.team,
    task: r.task,
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    location: r.location,
  }));

  // Group the same rows two ways. Map keeps insertion order, and rows are already sorted by start time,
  // so tasks come out in the order they first happen in the day.
  const byTask = new Map<string, Row[]>();
  const byPerson = new Map<string, Row[]>();
  for (const r of rows) {
    byTask.set(r.task, [...(byTask.get(r.task) ?? []), r]);
    byPerson.set(r.slug, [...(byPerson.get(r.slug) ?? []), r]);
  }

  return (
    <>
      <p className="eyebrow">
        <Link href="/admin">← Admin</Link>
      </p>
      <h1>All data</h1>
      <p className="card-time">
        {people.length} people · {byTask.size} tasks · {rows.length} shifts ·{" "}
        <a href="#by-task">By task</a> · <a href="#by-volunteer">By volunteer</a>
      </p>

      <h2 className="section-title" id="by-task">
        Volunteers by task
      </h2>
      {[...byTask].map(([task, list]) => (
        <section key={task} className="card">
          <p className="card-name">
            {task} <span className="card-time">· {new Set(list.map((r) => r.slug)).size} people</span>
          </p>
          <div className="table-scroll">
            <table className="admin-table">
              <tbody>
                {list.map((r) => (
                  <tr key={r.slug + r.startsAt}>
                    <td className="nowrap">{formatRange(r.startsAt, r.endsAt)}</td>
                    <td>
                      <Link href={`/admin/${r.slug}`}>{r.name}</Link>
                    </td>
                    <td className="muted">{r.location ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2 className="section-title" id="by-volunteer">
        Tasks by volunteer
      </h2>
      {people.map((p) => {
        const list = byPerson.get(p.slug) ?? [];
        return (
          <section key={p.slug} className="card">
            <p className="card-name">
              <Link href={`/admin/${p.slug}`}>{p.name}</Link>
              {p.team === "tech" && <span className="card-time"> · tech team</span>}
            </p>
            <p className="card-time">
              {p.arrive_at && p.leave_at
                ? `${formatTime(iso(p.arrive_at))} – ${formatTime(iso(p.leave_at))} · ${formatHours(iso(p.arrive_at), iso(p.leave_at))}`
                : "No hours set"}
            </p>
            {list.length > 0 && (
              <table className="admin-table">
                <tbody>
                  {list.map((r) => (
                    <tr key={r.startsAt + r.task}>
                      <td className="nowrap">{formatRange(r.startsAt, r.endsAt)}</td>
                      <td>{r.task}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </>
  );
}
