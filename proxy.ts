import { NextResponse, type NextRequest } from "next/server";
import { adminCookie, passwordIsRight } from "@/lib/admin-auth";

// One-tap admin login: opening /admin?key=<ADMIN_PASSWORD> logs you in.
// Runs before the page renders (Next.js "proxy"), because a page can't set cookies while rendering.
// Right or wrong, it redirects to plain /admin so the password doesn't stay in the address bar or history.
// A wrong key just lands on the normal password box.
export function proxy(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key === null) return NextResponse.next();

  const response = NextResponse.redirect(new URL("/admin", request.url));
  if (passwordIsRight(key)) response.cookies.set(adminCookie());
  return response;
}

// Only /admin itself; every other page skips this file entirely.
export const config = { matcher: "/admin" };
