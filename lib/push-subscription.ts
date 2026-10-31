// Checks the subscription a phone sends us. It comes from the internet, so nothing is trusted:
// the endpoint must be an https URL and the two keys must be short base64url strings.
export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

const base64url = /^[A-Za-z0-9_-]{1,200}$/;

export function parseSubscription(value: unknown): SubscriptionInput | null {
  const v = value as SubscriptionInput | null;
  if (!v || typeof v.endpoint !== "string" || v.endpoint.length > 1000) return null;
  if (!v.endpoint.startsWith("https://")) return null;
  if (!base64url.test(v.keys?.p256dh ?? "") || !base64url.test(v.keys?.auth ?? "")) return null;
  return { endpoint: v.endpoint, keys: { p256dh: v.keys.p256dh, auth: v.keys.auth } };
}
