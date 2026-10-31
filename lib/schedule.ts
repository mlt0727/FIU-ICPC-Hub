import { sql } from "./db";

// Everything one volunteer's page needs, read from the database in two queries.
export type Shift = { task: string; location: string | null; startsAt: string; endsAt: string };
export type Volunteer = {
  slug: string;
  name: string;
  team: "general" | "tech";
  arriveAt: string | null;
  leaveAt: string | null;
  shifts: Shift[];
};

// Times are passed around as ISO strings ("2026-11-07T13:00:00.000Z") so they can go to the browser as-is.
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : null);

export async function getVolunteer(slug: string): Promise<Volunteer | null> {
  const [v] = await sql`
    select id, slug, name, team, arrive_at, leave_at from volunteers where slug = ${slug}`;
  if (!v) return null;

  const rows = await sql`
    select t.name as task, coalesce(s.location, t.location) as location, s.starts_at, s.ends_at
    from shifts s join tasks t on t.id = s.task_id
    where s.volunteer_id = ${v.id}
    order by s.starts_at`;

  return {
    slug: v.slug,
    name: v.name,
    team: v.team,
    arriveAt: iso(v.arrive_at),
    leaveAt: iso(v.leave_at),
    shifts: rows.map((r) => ({
      task: r.task,
      location: r.location,
      startsAt: iso(r.starts_at)!,
      endsAt: iso(r.ends_at)!,
    })),
  };
}
