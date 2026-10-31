// Quick self-check for lib/rooms.ts. Run with: npx tsx scripts/check-rooms.ts
import assert from "node:assert/strict";
import { mapsLinkFor, roomsIn } from "../lib/rooms";

assert.deepEqual(roomsIn("PG6 116"), ["116"]);
assert.deepEqual(roomsIn("PG6 105 or 106"), ["105", "106"]);
assert.deepEqual(roomsIn("Room 1105"), []);
assert.deepEqual(roomsIn("PG6 Lobby"), ["Lobby"]);
assert.deepEqual(roomsIn("Outside PG6"), ["Spot 1", "Spot 2", "Spot 3"]);
assert.deepEqual(roomsIn("Outside PG6 · Spot 2 (south entrance)"), ["Spot 2"]);
assert.deepEqual(roomsIn("Outside PG6 · Spot 1 (below the Lobby)"), ["Spot 1"]);
assert.deepEqual(roomsIn("Outside PG6 · Spot 2 (south entrance, by 106)"), ["Spot 2"]);
assert.deepEqual(roomsIn("PG6"), []);
assert.deepEqual(roomsIn(null), []);
assert.ok(mapsLinkFor("Graham Center(GC) 8 street")?.startsWith("https://www.google.com/maps/"));
assert.equal(mapsLinkFor("PG6 116"), null);
console.log("rooms checks passed");
