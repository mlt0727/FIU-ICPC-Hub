import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Admin login without a users table: one password, kept in the ADMIN_PASSWORD environment variable.
// After a correct login the browser gets a cookie holding a signature made from that password.
// Nobody can forge the cookie without knowing the password, and changing the password logs everyone out.
const COOKIE = "admin";

function signature(password: string): string {
  return createHmac("sha256", password).update("fiu-icpc-hub admin").digest("hex");
}

// Compares in constant time, so the response time doesn't leak how much of a guess was right.
function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordIsRight(guess: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && same(signature(guess), signature(password));
}

export async function isAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!password && !!value && same(value, signature(password));
}

// Every admin action calls this first. Hiding a form is not protection: anyone can send the request.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not logged in");
}

// The login cookie: name, value and settings. Used by the login form and by the /admin?key=... link (proxy.ts).
export function adminCookie() {
  return {
    name: COOKIE,
    value: signature(process.env.ADMIN_PASSWORD!),
    httpOnly: true, // page JavaScript can't read it
    secure: process.env.NODE_ENV === "production", // https only on the real site
    // "lax": sent when you open an /admin link from another app or site (needed for the key link),
    // but not with forms other sites submit. Next.js also checks where Server Action requests come from.
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: 60 * 60 * 12, // 12 hours
  };
}

export async function startAdminSession(): Promise<void> {
  (await cookies()).set(adminCookie());
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
