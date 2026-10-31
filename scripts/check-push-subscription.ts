// Quick self-check for lib/push-subscription.ts. Run with: npx tsx scripts/check-push-subscription.ts
import assert from "node:assert/strict";
import { parseSubscription } from "../lib/push-subscription";

const good = { endpoint: "https://web.push.apple.com/abc", keys: { p256dh: "BNc_x-1", auth: "k9_Z" } };
assert.deepEqual(parseSubscription(good), good);
assert.equal(parseSubscription(null), null);
assert.equal(parseSubscription({ ...good, endpoint: "http://insecure.example" }), null);
assert.equal(parseSubscription({ ...good, keys: { p256dh: "has space", auth: "x" } }), null);
assert.equal(parseSubscription({ endpoint: good.endpoint }), null);
assert.equal(parseSubscription({ ...good, endpoint: "https://" + "a".repeat(1000) }), null);
console.log("push-subscription checks passed");
