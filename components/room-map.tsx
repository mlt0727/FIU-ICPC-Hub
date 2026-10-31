import { MAP, ROOMS } from "@/lib/rooms";

// The PG6 floor plan with the given places made obvious. Plain HTML/SVG, no JavaScript.
// The SVG sits exactly on top of the image and uses the image's own pixel coordinates (viewBox),
// so everything stays in place at any screen width. Three layers, from the bottom:
//   1. a dark veil over the whole map, with holes cut out where the highlighted places are,
//      so the target stays bright and everything else fades back;
//   2. a thick outline around each highlighted place (dark line under an amber line);
//   3. an amber name tag ("116", "Lobby", "Spot 2") on each place, readable even when the map is small.
export function RoomMap({ highlight }: { highlight: string[] }) {
  const rooms = ROOMS.filter((r) => highlight.includes(r.id));
  const { width: w, height: h } = MAP;

  // One path: the whole map, then each room. With fill-rule "evenodd" the rooms become holes.
  const veil = `M0 0H${w}V${h}H0Z ` + rooms.map((r) => `M${r.points.replaceAll(" ", " L")}Z`).join(" ");

  return (
    <figure className="room-map">
      <div className="room-map-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- one small static image, no resizing needed */}
        <img src={MAP.src} width={w} height={h} alt={`PG6 floor plan. ${rooms.map((r) => r.label).join(", ")} highlighted.`} />
        <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <path d={veil} fillRule="evenodd" className="room-map-veil" />
          {rooms.map((r) => (
            <polygon key={`${r.id}-edge`} points={r.points} className="room-map-edge" />
          ))}
          {rooms.map((r) => (
            <polygon key={r.id} points={r.points} className="room-map-highlight" />
          ))}
          {rooms.map((r) => {
            const [x, y] = r.pin;
            const tagWidth = r.id.length * 40 + 60; // rough text width at font-size 64
            return (
              <g key={`${r.id}-tag`} className="room-map-tag">
                <rect x={x - tagWidth / 2} y={y - 48} width={tagWidth} height={96} rx={48} />
                <text x={x} y={y + 2}>
                  {r.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        Go to <strong>{rooms.map((r) => r.label).join(" or ")}</strong> · pinch to zoom
      </figcaption>
    </figure>
  );
}
