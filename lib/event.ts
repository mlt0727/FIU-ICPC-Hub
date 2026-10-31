import schedule from "@/data/event-schedule.json";
import type { Card } from "@/components/task-list";
import { mapsLinkFor, roomsIn } from "./rooms";
import { eventTimeIso, formatRange } from "./time";

// The contest day schedule everyone sees on the main page, from data/event-schedule.json.
// Each item becomes the same kind of card as a volunteer's task, so it gets Now / Next / Done and the map too.
// Changing the JSON needs a push (it is part of the site, not the database).
type Item = { title: string; start: string; end: string; location: string };

export function eventCards(): Card[] {
  return (schedule as Item[]).map((item) => {
    const startsAt = eventTimeIso(item.start);
    const endsAt = eventTimeIso(item.end);
    return {
      task: item.title,
      location: item.location,
      rooms: roomsIn(item.location),
      mapsUrl: mapsLinkFor(item.location),
      startsAt,
      endsAt,
      time: formatRange(startsAt, endsAt),
    };
  });
}
