import { MAP, ROOMS } from "@/lib/rooms";

// The PG6 floor plan with the given rooms outlined in amber. Plain HTML/SVG, no JavaScript.
// The SVG sits exactly on top of the image and uses the image's own pixel coordinates (viewBox),
// so the outlines stay in place at any screen width.
export function RoomMap({ highlight }: { highlight: string[] }) {
  const rooms = ROOMS.filter((r) => highlight.includes(r.id));
  return (
    <figure className="room-map">
      <div className="room-map-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- one small static image, no resizing needed */}
        <img src={MAP.src} width={MAP.width} height={MAP.height} alt={`PG6 floor plan. ${rooms.map((r) => r.label).join(", ")} highlighted.`} />
        <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} aria-hidden="true">
          {/* Dark wide line underneath, amber line on top: stays visible on any room color (112 is orange). */}
          {rooms.map((r) => (
            <polygon key={`${r.id}-edge`} points={r.points} className="room-map-edge" />
          ))}
          {rooms.map((r) => (
            <polygon key={r.id} points={r.points} className="room-map-highlight" />
          ))}
        </svg>
      </div>
      <figcaption>{rooms.map((r) => r.label).join(" · ")} · pinch to zoom</figcaption>
    </figure>
  );
}
