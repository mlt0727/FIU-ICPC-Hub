"use client";

import { useEffect, useState } from "react";

// One card per task. Runs in the browser so the "Now" outline moves on its own as time passes.
export type Card = { task: string; location: string | null; startsAt: string; endsAt: string; time: string };

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
