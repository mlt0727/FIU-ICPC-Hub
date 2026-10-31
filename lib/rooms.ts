// Places drawn on the PG6 floor plan (public/pg6-map.webp, 1579 × 996 px).
// `points` outlines each place in image pixels: "x,y x,y ...", clockwise from the top-left corner.
// To add a place: open the image, read off its corners (or centre + size for a spot), add a line here.
export const MAP = { src: "/pg6-map.webp", width: 1579, height: 996 };

// id: the word to look for in a location text ("PG6 116" -> 116).
// group: a shared name that highlights every place in the group ("Outside PG6" -> all three Directions spots).
export type Room = { id: string; label: string; points: string; group?: string };

// An oval drawn as a 16-sided polygon, for spots outside that aren't rooms.
function oval(cx: number, cy: number, rx: number, ry: number): string {
  return Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 2 * Math.PI;
    return `${Math.round(cx + rx * Math.cos(a))},${Math.round(cy + ry * Math.sin(a))}`;
  }).join(" ");
}

export const ROOMS: Room[] = [
  { id: "116", label: "Room 116", points: "222,15 810,15 810,350 222,350" },
  { id: "112", label: "Room 112", points: "1148,15 1428,15 1428,352 1148,352" },
  { id: "105", label: "Room 105", points: "722,425 1060,425 1060,642 930,645 930,668 722,668" },
  { id: "106", label: "Room 106", points: "1060,425 1168,425 1168,815 722,815 722,672 930,672 930,648 1060,648" },
  { id: "Lobby", label: "Lobby", points: "12,20 205,20 205,668 12,668" },
  // Where the three Directions volunteers stand (circled by Lingtong on 2026-10-31).
  { id: "Spot 1", label: "Spot 1", points: oval(129, 784, 74, 43), group: "Outside PG6" },
  { id: "Spot 2", label: "Spot 2", points: oval(882, 895, 93, 36), group: "Outside PG6" },
  { id: "Spot 3", label: "Spot 3", points: oval(1366, 544, 72, 65), group: "Outside PG6" },
];

const mentions = (text: string, name: string) => new RegExp(`\\b${name}\\b`, "i").test(text);

// Which places does a location text mention?
//   "PG6 105 or 106" -> ["105", "106"]     "PG6 Lobby" -> ["Lobby"]
//   "Outside PG6" -> all three spots       "Outside PG6 · Spot 2 (...)" -> just ["Spot 2"]
// Whole words only, so "1105" doesn't match "105". A specific id wins over its group name.
// Text in (parentheses) is only a description and is ignored: "Spot 1 (below the Lobby)" -> ["Spot 1"].
export function roomsIn(location: string | null): string[] {
  if (!location) return [];
  const text = location.replace(/\([^)]*\)/g, "");
  const byId = ROOMS.filter((r) => mentions(text, r.id));
  const found = byId.length > 0 ? byId : ROOMS.filter((r) => r.group && mentions(text, r.group));
  return found.map((r) => r.id);
}

// Places that aren't on the floor plan get a Google Maps link instead.
const EXTERNAL = [
  { match: /graham center/i, url: "https://www.google.com/maps/search/?api=1&query=Graham+Center%2C+Florida+International+University" },
];

export function mapsLinkFor(location: string | null): string | null {
  return EXTERNAL.find((p) => location && p.match.test(location))?.url ?? null;
}
