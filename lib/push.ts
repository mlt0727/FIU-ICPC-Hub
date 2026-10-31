import webpush from "web-push";
import { sql } from "./db";

// Sends push notifications through Apple's / Google's push services.
// The VAPID keys prove to those services that the message really comes from our site.
// The "subject" must be a contact URL or mailto:; the site's own address is enough.
// Set up on first send, not at import, so a build without the keys still succeeds.
let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.SITE_URL ?? "https://fiu-icpc-hub.vercel.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export type Message = { title: string; body: string; url: string };
type Subscription = { endpoint: string; p256dh: string; auth: string };

// Sends one message to one phone. Returns false if it failed.
export async function sendPush(sub: Subscription, message: Message, ttlSeconds: number): Promise<boolean> {
  try {
    configure();
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(message),
      // urgency "high": deliver now even if the phone is saving battery.
      // TTL: if the phone is offline longer than this, drop the message instead of delivering it late.
      { TTL: ttlSeconds, urgency: "high" },
    );
    return true;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    // 404 / 410 = this subscription is gone for good (app deleted, notifications turned off). Forget it.
    if (status === 404 || status === 410) {
      await sql`delete from push_subscriptions where endpoint = ${sub.endpoint}`;
    } else {
      console.error("Push failed", status, (error as Error).message);
    }
    return false;
  }
}
