import { mapsLinkFor, roomsIn } from "@/lib/rooms";
import type { Volunteer } from "@/lib/schedule";
import { formatEventDay, formatHours, formatRange, formatTime } from "@/lib/time";
import { NotifyButton } from "./notify-button";
import { TaskList } from "./task-list";

// The volunteer part of a page: name and hours on top, then the task cards.
// Used by both the personal page (/lingtong-meng) and the general page when the cookie says who you are.
export function VolunteerView({ volunteer: v, now }: { volunteer: Volunteer; now: string | undefined }) {
  const frozenNow = now ? Date.parse(now) : NaN;
  const frozen = !Number.isNaN(frozenNow);

  return (
    <section>
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

      <NotifyButton slug={v.slug} publicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />

      {v.team === "tech" ? (
        <div className="card">
          <h2 className="card-name">Tech team</h2>
          <p className="card-loc">Tech team details will appear here.</p>
        </div>
      ) : (
        <TaskList
          cards={v.shifts.map((s) => ({
            ...s,
            rooms: roomsIn(s.location),
            mapsUrl: mapsLinkFor(s.location),
            time: formatRange(s.startsAt, s.endsAt),
          }))}
          serverNow={frozen ? frozenNow : Date.now()}
          frozen={frozen}
        />
      )}
    </section>
  );
}
