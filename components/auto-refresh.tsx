"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-reads the page from the server every minute (and when the app comes back to the front),
// so new announcements and schedule changes show up without the volunteer pulling to refresh.
// A Home Screen app can stay open for hours, so without this it would keep showing old data.
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
  return null;
}
