import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { RoomMap } from "@/components/room-map";
import { TaskList } from "@/components/task-list";
import { VolunteerNav } from "@/components/volunteer-nav";
import { sql } from "@/lib/db";
import { eventCards } from "@/lib/event";
import { LUNCH_MAP_URL, WALK_BACK_URL } from "@/lib/rooms";
import { formatEventDay } from "@/lib/time";

type Props = { searchParams: Promise<{ now?: string }> };

// Which volunteer is looking, if any? Only a slug that still exists in the database counts,
// so a removed volunteer doesn't get a "My schedule" tab that leads to a 404.
async function volunteerSlug(): Promise<string | null> {
  const slug = (await cookies()).get("volunteer")?.value;
  if (!slug) return null;
  const [row] = await sql`select slug from volunteers where slug = ${slug}`;
  return row ? (row.slug as string) : null;
}

export async function generateMetadata(): Promise<Metadata> {
  // A volunteer who adds this page to the Home Screen still gets an icon that opens their own page.
  const slug = await volunteerSlug();
  return slug ? { manifest: `/manifest/${slug}` } : {};
}

// "/" — the main contest day page for everyone: contestants, coaches and volunteers.
export default async function Home({ searchParams }: Props) {
  const { now } = await searchParams;
  const slug = await volunteerSlug();
  const frozenNow = now ? Date.parse(now) : NaN;
  const frozen = !Number.isNaN(frozenNow);

  return (
    <>
      {slug && <VolunteerNav slug={slug} current="event" />}
      <p className="eyebrow">FIU ICPC Hub · {formatEventDay()}</p>
      <h1>Contest day</h1>

      <h2 className="section-title">Schedule</h2>
      <TaskList cards={eventCards()} serverNow={frozen ? frozenNow : Date.now()} frozen={frozen} />

      {/* Seating chart from the organizers (PG6 Map 116 – November 7 2026), shown as one picture. */}
      <h2 className="section-title">Seating in Room 116</h2>
      <div className="card">
        <p className="card-loc">Find your team&apos;s table for the contest. Tap the picture to open a bigger view.</p>
        {/* Opens our /seating page, not the bare image: inside the Home Screen app a bare image has no way back. */}
        <Link href="/seating" className="seating-link">
          {/* eslint-disable-next-line @next/next/no-img-element -- one static picture, no resizing needed */}
          <img
            src="/seating-116.webp"
            width={2667}
            height={1500}
            alt="Seating chart for Room 116: each table shows the school, division (D1 or D2) and team name."
          />
        </Link>
      </div>

      <h2 className="section-title">Map of PG6</h2>
      <div className="card">
        <RoomMap
          highlight={["Lobby", "116", "112"]}
          caption={
            <>
              <strong>Lobby</strong>: registration, dinner, awards · <strong>116</strong>: contest · <strong>112</strong>: coaches
            </>
          }
        />
      </div>

      <h2 className="section-title">Lunch</h2>
      <div className="card">
        <p className="card-name">8th Street Campus Kitchen</p>
        <p className="card-loc">Inside the Graham Center (GC). Lunch is served here, not in PG6.</p>
        <a className="card-map-link" href={LUNCH_MAP_URL} target="_blank" rel="noopener noreferrer">
          Open in Google Maps ↗
        </a>
        <br />
        <a className="card-map-link" href={WALK_BACK_URL} target="_blank" rel="noopener noreferrer">
          Walking directions back to PG6 ↗
        </a>
      </div>
    </>
  );
}
