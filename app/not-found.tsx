import Link from "next/link";

// Shown for a mistyped personal link, e.g. /lingtong-mneg.
export default function NotFound() {
  return (
    <>
      <p className="eyebrow">ICPC Checkpoint</p>
      <h1>We couldn&apos;t find that page</h1>
      <p className="card-time">
        If this is your personal link, check the spelling with the organizers. <Link href="/" style={{ color: "var(--now)" }}>Go to the main page</Link>
      </p>
    </>
  );
}
