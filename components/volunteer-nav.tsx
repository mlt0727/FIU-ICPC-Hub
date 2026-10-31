import Link from "next/link";

// Two tabs at the top, shown only to volunteers: their own page and the main contest day page.
// Contestants never see it (they have no volunteer cookie and no personal link).
// The current tab is marked with aria-current, which also drives its highlighted style.
export function VolunteerNav({ slug, current }: { slug: string; current: "me" | "event" }) {
  return (
    <nav className="volunteer-nav" aria-label="Volunteer pages">
      <Link href={`/${slug}`} aria-current={current === "me" ? "page" : undefined}>
        My schedule
      </Link>
      <Link href="/" aria-current={current === "event" ? "page" : undefined}>
        Contest day
      </Link>
    </nav>
  );
}
