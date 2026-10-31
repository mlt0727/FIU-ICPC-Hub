"use server";

// Everything the admin page can change. Each function is a "Server Action": the form in the browser
// sends a POST, and this code runs on the server. Anyone can send that POST, so every action except
// login starts with requireAdmin(), and every input is checked before it reaches the database.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { endAdminSession, passwordIsRight, requireAdmin, startAdminSession } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { sendPush } from "@/lib/push";

const EVENT_DATE = process.env.EVENT_DATE ?? "2026-11-07";
const EVENT_TZ = process.env.EVENT_TZ ?? "America/New_York";

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const id = (form: FormData, name: string) => {
  const n = Number(form.get(name));
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Bad ${name}`);
  return n;
};
// "08:00" on the event day in New York -> an exact moment, same rule as the Excel import.
const isTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const at = (t: string) => sql`((${EVENT_DATE}::date + ${t}::time) at time zone ${EVENT_TZ})`;

// ---------- Login ----------

export async function login(_prev: { error: string } | null, form: FormData) {
  if (!passwordIsRight(text(form, "password"))) {
    await new Promise((r) => setTimeout(r, 1000)); // slows down password guessing
    return { error: "Wrong password." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin");
}

// ---------- Announcements ----------

export type SendResult = { ok: boolean; message: string } | null;

export async function sendAnnouncement(_prev: SendResult, form: FormData): Promise<SendResult> {
  await requireAdmin();
  const title = text(form, "title");
  const body = text(form, "body");
  if (!title || title.length > 80) return { ok: false, message: "Title is required (80 characters max)." };
  if (!body || body.length > 500) return { ok: false, message: "Message is required (500 characters max)." };

  await sql`insert into announcements (title, body) values (${title}, ${body})`;

  // Push to every phone that turned reminders on. Tapping it opens that person's page, where the
  // announcement is shown at the top. TTL 1 hour: an old announcement is better skipped than late.
  const subs = await sql`
    select s.endpoint, s.p256dh, s.auth, v.slug
    from push_subscriptions s left join volunteers v on v.id = s.volunteer_id`;
  const results = await Promise.all(
    subs.map((s) =>
      sendPush(
        { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
        { title, body, url: s.slug ? `/${s.slug}` : "/" },
        3600,
      ),
    ),
  );
  const sent = results.filter(Boolean).length;
  refresh();
  return { ok: true, message: `Posted. Sent to ${sent} of ${subs.length} phones.` };
}

export async function deleteAnnouncement(form: FormData) {
  await requireAdmin();
  await sql`delete from announcements where id = ${id(form, "id")}`;
  refresh();
}

// ---------- Tasks ----------

export async function saveTask(form: FormData) {
  await requireAdmin();
  const location = text(form, "location").slice(0, 200);
  const instructions = text(form, "instructions").slice(0, 2000);
  await sql`
    update tasks set location = ${location || null}, instructions = ${instructions || null}
    where id = ${id(form, "id")}`;
  refresh();
}

// ---------- One volunteer's shifts ----------

export async function saveShift(form: FormData) {
  await requireAdmin();
  const start = text(form, "start");
  const end = text(form, "end");
  if (!isTime(start) || !isTime(end) || end <= start) throw new Error("Bad times");
  const location = text(form, "location").slice(0, 200);
  // If the start time moves, forget that the reminder was sent, so the new time gets one.
  await sql`
    update shifts set
      starts_at = ${at(start)},
      ends_at = ${at(end)},
      location = ${location || null},
      reminder_sent_at = case when starts_at = ${at(start)} then reminder_sent_at end
    where id = ${id(form, "id")}`;
  refresh();
}

export async function deleteShift(form: FormData) {
  await requireAdmin();
  await sql`delete from shifts where id = ${id(form, "id")}`;
  refresh();
}

export async function addShift(form: FormData) {
  await requireAdmin();
  const start = text(form, "start");
  const end = text(form, "end");
  if (!isTime(start) || !isTime(end) || end <= start) throw new Error("Bad times");
  await sql`
    insert into shifts (volunteer_id, task_id, starts_at, ends_at)
    values (${id(form, "volunteer_id")}, ${id(form, "task_id")}, ${at(start)}, ${at(end)})`;
  refresh();
}
