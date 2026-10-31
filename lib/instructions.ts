// Turns instruction text (written in a tiny Markdown-like format) into blocks the card can show:
//   "## Heading"      -> heading
//   "1. Do this"      -> numbered list item (consecutive ones form one list)
//   "- A point"       -> bullet list item
//   anything else     -> paragraph;  blank lines just separate things
// "**bold**" inside any line is handled by splitBold(). Text is never turned into HTML,
// so nothing typed on the admin page can inject code into the page.
export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "numbered" | "bullets"; items: string[] };

export function parseInstructions(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const last = blocks.at(-1);
    if (heading) blocks.push({ type: "heading", text: heading[1] });
    else if (numbered) {
      if (last?.type === "numbered") last.items.push(numbered[1]);
      else blocks.push({ type: "numbered", items: [numbered[1]] });
    } else if (bullet) {
      if (last?.type === "bullets") last.items.push(bullet[1]);
      else blocks.push({ type: "bullets", items: [bullet[1]] });
    } else blocks.push({ type: "paragraph", text: line });
  }
  return blocks;
}

// "Wear the **blue shirt**." -> [{ text: "Wear the ", bold: false }, { text: "blue shirt", bold: true }, ...]
export function splitBold(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/\*\*(.+?)\*\*/)
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((p) => p.text);
}
