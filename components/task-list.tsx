"use client";

import { useEffect, useState } from "react";
import { RoomMap } from "./room-map";

// One card per task. Runs in the browser so the "Now" outline moves on its own as time passes.
// `rooms` = places on the floor plan that this card's location mentions (empty = no "Show on map").
// `mapsUrl` = Google Maps link for places that aren't on the floor plan (Graham Center).
export type Card = {
  task: string;
  location: string | null;
  rooms: string[];
  mapsUrl: string | null;
  startsAt: string;
  endsAt: string;
  time: string;
};

export function TaskList({ cards, serverNow, frozen }: { cards: Card[]; serverNow: number; frozen: boolean }) {
  // Start from the server's clock so the first render matches the HTML, then switch to the phone's clock.
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    if (frozen) return; // ?now=... in the URL pins the clock for testing
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [frozen]);

  const nextIndex = cards.findIndex((c) => Date.parse(c.startsAt) > now);

  return (
    <ul className="cards">
      {cards.map((c, i) => {
        const start = Date.parse(c.startsAt);
        const end = Date.parse(c.endsAt);
        const state = now >= end ? "done" : now >= start ? "now" : "upcoming";
        const label =
          state === "now" ? `Now · ${c.time}` : state === "done" ? `${c.time} · Done` : i === nextIndex ? `Next · ${c.time}` : c.time;
        return (
          <li key={c.startsAt + c.task} className={`card ${state}`}>
            <p className="card-time">{label}</p>
            <h2 className="card-name">{c.task}</h2>
            <p className="card-loc">
              <PinIcon />
              {c.location ?? "Location coming soon"}
            </p>
            {c.rooms.length > 0 && (
              // <details> opens and closes by itself in the browser: no extra code, works with keyboard and screen readers.
              <details className="card-map">
                <summary>Show on map</summary>
                <RoomMap highlight={c.rooms} />
              </details>
            )}
            {c.mapsUrl && (
              <a className="card-map-link" href={c.mapsUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Maps ↗
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
