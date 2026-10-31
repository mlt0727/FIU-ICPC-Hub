// Quick self-check for lib/instructions.ts. Run with: npx tsx scripts/check-instructions.ts
import assert from "node:assert/strict";
import { parseInstructions, splitBold } from "../lib/instructions";

const blocks = parseInstructions("Intro line.\n\n## Students\n1. First\n2. Second\n- A\n- B\n## Coaches\n1. Only");
assert.deepEqual(blocks, [
  { type: "paragraph", text: "Intro line." },
  { type: "heading", text: "Students" },
  { type: "numbered", items: ["First", "Second"] },
  { type: "bullets", items: ["A", "B"] },
  { type: "heading", text: "Coaches" },
  { type: "numbered", items: ["Only"] },
]);
// A heading that starts with a number stays a heading, not a list item.
assert.deepEqual(parseInstructions("## 1. Roles"), [{ type: "heading", text: "1. Roles" }]);
assert.deepEqual(splitBold("Wear the **blue shirt** now"), [
  { text: "Wear the ", bold: false },
  { text: "blue shirt", bold: true },
  { text: " now", bold: false },
]);
assert.deepEqual(splitBold("<b>not html</b>"), [{ text: "<b>not html</b>", bold: false }]);
console.log("instructions checks passed");
