import type { Metadata } from "next";
import Link from "next/link";
import { AddVolunteerForm, AnnouncementForm, LoginForm, SubmitButton } from "@/components/admin-forms";
import { isAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { formatTime } from "@/lib/time";
import { deleteAnnouncement, logout, saveTask } from "./actions";

export const metadata: Metadata = { title: "Admin · FIU ICPC Hub", robots: { index: false } };

// /admin — organizers only. Without the login cookie it shows just the password box.
export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <>
        <p className="eyebrow">FIU ICPC Hub</p>
        <h1>Admin</h1>
        {process.env.ADMIN_PASSWORD ? <LoginForm /> : <p className="card-time">ADMIN_PASSWORD is not set on the server.</p>}
      </>
    );
  }

  const [announcements, tasks, volunteers] = await Promise.all([
    sql`select id, title, body, created_at from announcements order by created_at desc`,
    sql`select id, name, location, instructions from tasks order by name`,
    sql`select slug, name, team from volunteers order by team, name`,
  ]);

  return (
    <>
      <p className="eyebrow">FIU ICPC Hub</p>
      <h1>Admin</h1>
      <div className="admin-top">
        <Link href="/admin/overview">All data: by task and by volunteer →</Link>
        <form action={logout}>
          <SubmitButton quiet>Log out</SubmitButton>
        </form>
      </div>

      <h2 className="section-title">Announcement</h2>
      <p className="card-time">Shown at the top of every volunteer page, and sent as a notification to every phone with reminders on.</p>
      <AnnouncementForm />
      <ul className="cards">
        {announcements.map((a) => (
          <li key={a.id} className="card">
            <p className="card-time">{formatTime(new Date(a.created_at).toISOString())}</p>
            <p className="card-name">{a.title}</p>
            <p className="announcement-body">{a.body}</p>
            <form action={deleteAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <SubmitButton quiet>Delete</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="section-title">Task locations</h2>
      <p className="card-time">Changes show on everyone&apos;s cards right away. A room number in the location (116, 105, Lobby…) turns on the map.</p>
      <ul className="cards">
        {tasks.map((t) => (
          <li key={t.id} className="card">
            <form action={saveTask} className="admin-form">
              <input type="hidden" name="id" value={t.id} />
              <p className="card-name">{t.name}</p>
              <label className="field">
                Location
                <input name="location" defaultValue={t.location ?? ""} maxLength={200} />
              </label>
              <label className="field">
                Instructions
                <textarea name="instructions" defaultValue={t.instructions ?? ""} rows={2} maxLength={2000} />
              </label>
              <SubmitButton quiet>Save</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="section-title">People</h2>
      <p className="card-time">Tap a name to change that person&apos;s shifts.</p>
      <ul className="admin-people">
        {volunteers.map((v) => (
          <li key={v.slug}>
            <Link href={`/admin/${v.slug}`}>{v.name}</Link>
            {v.team === "tech" && <span className="card-time"> · tech</span>}
          </li>
        ))}
      </ul>

      <h2 className="section-title">Add a volunteer</h2>
      <p className="card-time">
        For people who aren&apos;t in the Excel file. Their link is made from the name; after adding, you can give them shifts.
      </p>
      <AddVolunteerForm />
    </>
  );
}
