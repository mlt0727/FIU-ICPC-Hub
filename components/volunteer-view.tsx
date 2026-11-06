import { CHECK_IN_LOCATION, mapsLinkFor, roomsIn } from "@/lib/rooms";
import type { Volunteer } from "@/lib/schedule";
import { formatEventDay, formatHours, formatRange, formatTime } from "@/lib/time";
import { Announcements } from "./announcements";
import { AutoRefresh } from "./auto-refresh";
import { NotifyButton } from "./notify-button";
import { type Card, TaskList } from "./task-list";
import { VolunteerNav } from "./volunteer-nav";

// Everyone checks in at Room 112 when they arrive. This card isn't stored in the database: it is made
// from the arrive time, so changing someone's arrive time on the admin page moves it too.
// It counts as "Now" for the first 15 minutes after arriving.
function checkInCard(arriveAt: string): Card {
  return {
    task: "Check in",
    location: CHECK_IN_LOCATION,
    // Rule from the organizers: check in before anything else, even if lunch starts at the same time.
    instructions:
      "When you arrive, come to **Room 112 first** and check in, before your first task or before lunch.\nThen go to your next card.",
    rooms: roomsIn(CHECK_IN_LOCATION),
    mapsUrl: null,
    startsAt: arriveAt,
    endsAt: new Date(Date.parse(arriveAt) + 15 * 60_000).toISOString(),
    time: formatTime(arriveAt), // a single time, not a range
  };
}

// The volunteer part of a page: name and hours on top, then the task cards.
// Used by both the personal page (/lingtong-meng) and the general page when the cookie says who you are.
export function VolunteerView({ volunteer: v, now }: { volunteer: Volunteer; now: string | undefined }) {
  const frozenNow = now ? Date.parse(now) : NaN;
  const frozen = !Number.isNaN(frozenNow);

  return (
    <section>
      <VolunteerNav slug={v.slug} current="me" />
      <p className="eyebrow">ICPC Volunteer · {formatEventDay()}</p>
      <h1>{v.name}</h1>
      {v.arriveAt && v.leaveAt && (
        <dl className="hours">
          <div>
            <dt>Arrive</dt>
            <dd>{formatTime(v.arriveAt)}</dd>
          </div>
          <div>
            <dt>Leave</dt>
            <dd>{formatTime(v.leaveAt)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatHours(v.arriveAt, v.leaveAt)}</dd>
          </div>
        </dl>
      )}

      <AutoRefresh />
      <Announcements />
      <NotifyButton slug={v.slug} publicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />

      <TaskList
        cards={[
          ...(v.arriveAt ? [checkInCard(v.arriveAt)] : []),
          // The tech team has its own plan, so they only get the check-in card.
          ...(v.team === "tech"
            ? []
            : v.shifts.map((s) => ({
                ...s,
                rooms: roomsIn(s.location),
                mapsUrl: mapsLinkFor(s.location),
                time: formatRange(s.startsAt, s.endsAt),
              }))),
        ]}
        serverNow={frozen ? frozenNow : Date.now()}
        frozen={frozen}
      />
      {v.team === "tech" && (
        <div className="card">
          <h2 className="card-name">Tech team</h2>
          <p className="card-loc">Tech team details will appear here.</p>
        </div>
      )}
    </section>
  );
}
