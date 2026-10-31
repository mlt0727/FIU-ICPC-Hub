"use client";

import { useEffect } from "react";

// Opening your personal link once saves your slug in a cookie for 60 days.
// After that the general page ("/") also knows who you are. Contestants never open a personal link, so they never get it.
export function RememberMe({ slug }: { slug: string }) {
  useEffect(() => {
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `volunteer=${slug}; max-age=${60 * 60 * 24 * 60}; path=/; samesite=lax${secure}`;
  }, [slug]);
  return null;
}
