import { parseInstructions, splitBold } from "@/lib/instructions";

// Shows a task's instructions (headings, numbered steps, bullet points, bold words).
// Used inside the "Instructions" dropdown on a task card.
export function Instructions({ text }: { text: string }) {
  return (
    <div className="instructions">
      {parseInstructions(text).map((block, i) => {
        if (block.type === "heading") return <h3 key={i}>{rich(block.text)}</h3>;
        if (block.type === "paragraph") return <p key={i}>{rich(block.text)}</p>;
        const List = block.type === "numbered" ? "ol" : "ul";
        return (
          <List key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{rich(item)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

function rich(text: string) {
  return splitBold(text).map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : part.text));
}
