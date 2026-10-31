import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/admin-forms";
import { isAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { formatHours, formatTime, toInputTime } from "@/lib/time";
import { addShift, deleteShift, saveShift } from "../actions";

export const metadata: Metadata = { title: "Admin · FIU ICPC Hub", robots: { index: false } };

// /admin/lingtong-meng — change one person's shifts.
export default async function AdminVolunteerPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { slug } = await params;

  const [v] = await sql`select id, slug, name, arrive_at, leave_at from volunteers where slug = ${slug}`;
  if (!v) notFound();
  const [shifts, tasks] = await Promise.all([
    sql`
      select s.id, t.name as task, s.starts_at, s.ends_at, s.location, t.location as task_location
      from shifts s join tasks t on t.id = s.task_id
      where s.volunteer_id = ${v.id} order by s.starts_at`,
    sql`select id, name from tasks order by name`,
  ]);
  const iso = (d: unknown) => new Date(d as string).toISOString();

  return (
    <>
      <p className="eyebrow">
        <Link href="/admin">← Admin</Link>
      </p>
      <h1>{v.name}</h1>
      <p className="card-time">
        {v.arrive_at && v.leave_at
          ? `${formatTime(iso(v.arrive_at))} – ${formatTime(iso(v.leave_at))} · ${formatHours(iso(v.arrive_at), iso(v.leave_at))}`
          : "No hours set"}{" "}
        · <Link href={`/${v.slug}`}>Open their page</Link>
      </p>

      <ul className="cards">
        {shifts.map((s) => (
          <li key={s.id} className="card">
            <p className="card-name">{s.task}</p>
            <form action={saveShift} className="admin-form">
              <input type="hidden" name="id" value={s.id} />
              <div className="field-row">
                <label className="field">
                  Start
                  <input type="time" name="start" defaultValue={toInputTime(iso(s.starts_at))} required />
                </label>
                <label className="field">
                  End
                  <input type="time" name="end" defaultValue={toInputTime(iso(s.ends_at))} required />
                </label>
              </div>
              <label className="field">
                Location for this person only
                <input name="location" defaultValue={s.location ?? ""} placeholder={s.task_location ?? "Same as the task"} maxLength={200} />
              </label>
              <SubmitButton quiet>Save</SubmitButton>
            </form>
            <form action={deleteShift}>
              <input type="hidden" name="id" value={s.id} />
              <SubmitButton quiet>Remove this shift</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="section-title">Add a shift</h2>
      <form action={addShift} className="card admin-form">
        <input type="hidden" name="volunteer_id" value={v.id} />
        <label className="field">
          Task
          <select name="task_id" required>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <label className="field">
            Start
            <input type="time" name="start" required />
          </label>
          <label className="field">
            End
            <input type="time" name="end" required />
          </label>
        </div>
        <SubmitButton>Add shift</SubmitButton>
      </form>
    </>
  );
}
