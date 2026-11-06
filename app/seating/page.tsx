import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Seating in Room 116 · FIU ICPC Hub" };

// /seating — the Room 116 seating chart, big enough to read on a phone.
// It is a real page (not the bare image file) so that inside the Home Screen app it keeps the safe
// spacing under the status bar and has a way back: a Home Screen app has no browser back button.
// The picture is drawn wider than the screen; swipe sideways inside its box, or pinch to zoom.
export default function SeatingPage() {
  return (
    <>
      <p className="eyebrow">
        <Link href="/">← Contest day</Link>
      </p>
      <h1>Seating in Room 116</h1>
      <p className="card-loc">Find your team&apos;s name. Swipe sideways to see the whole room, or pinch to zoom.</p>
      <div className="seating-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- one static picture, no resizing needed */}
        <img
          src="/seating-116.webp"
          width={2667}
          height={1500}
          alt="Seating chart for Room 116: each table shows the school, division (D1 or D2) and team name."
        />
      </div>
      <p className="card-time seating-tip">Tip: turn your phone sideways for a bigger view.</p>
    </>
  );
}
