"use client";

import { useEffect, useState } from "react";
import { REMINDER_MINUTES } from "@/lib/time";

// The "Turn on reminders" box on a volunteer's page.
// iPhone only allows notifications inside the Home Screen app, so in plain Safari it explains that step instead.
type State =
  | "loading"
  | "needs-home-screen"
  | "unsupported"
  | "not-set-up"
  | "off"
  | "working"
  | "on"
  | "blocked"
  | "error";

export function NotifyButton({ slug, publicKey }: { slug: string; publicKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [testNote, setTestNote] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // iPhone Safari hides PushManager until the site is opened from the Home Screen.
        const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        setState(iOS ? "needs-home-screen" : "unsupported");
        return;
      }
      // No VAPID key on the server (env var missing): the phone would refuse to subscribe without even asking.
      if (!publicKey) return setState("not-set-up");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await save(slug, existing); // re-save, in case it belonged to someone else on this phone before
        setState("on");
      } else {
        setState("off");
      }
    })().catch((e) => {
      console.error("Reminders setup failed", e);
      setState("error");
    });
  }, [slug, publicKey]);

  // Must run straight from the tap: iPhone only shows the permission question after a user gesture.
  async function turnOn() {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      await save(slug, sub);
      setState("on");
    } catch (e) {
      console.error("Turning on reminders failed", e);
      setState(Notification.permission === "denied" ? "blocked" : "error");
    }
  }

  async function sendTest() {
    setTestNote("Sending…");
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub?.endpoint }),
    });
    setTestNote(res.ok ? "Sent. It should arrive in a few seconds." : "Couldn't send. Try turning reminders on again.");
  }

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="notify" role="status">
      {state === "needs-home-screen" && (
        <p>
          To get reminders, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. Open FIU ICPC Hub from
          your Home Screen and turn reminders on there.
        </p>
      )}
      {(state === "off" || state === "working") && (
        <>
          <p>Get a notification {REMINDER_MINUTES} minutes before each task, plus announcements from the organizers.</p>
          <button className="button" onClick={turnOn} disabled={state === "working"}>
            {state === "working" ? "Turning on…" : "Turn on reminders"}
          </button>
        </>
      )}
      {state === "on" && (
        <>
          <p>Reminders are on for this phone.</p>
          <button className="button-quiet" onClick={sendTest}>
            Send a test notification
          </button>
          {testNote && <p className="notify-note">{testNote}</p>}
        </>
      )}
      {state === "not-set-up" && <p>Reminders aren&apos;t available yet. Check back later.</p>}
      {state === "blocked" &&<p>Notifications are blocked. Turn them on for FIU ICPC Hub in your phone&apos;s Settings, then reopen this page.</p>}
      {state === "error" && (
        <>
          <p>Couldn&apos;t turn on reminders.</p>
          <button className="button" onClick={turnOn}>
            Try again
          </button>
        </>
      )}
    </div>
  );
}

// The VAPID public key is base64url text; some Safari versions only accept it as raw bytes.
function keyBytes(base64url: string) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4);
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function save(slug: string, sub: PushSubscription) {
  return fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, subscription: sub.toJSON() }),
  }).then((res) => {
    if (!res.ok) throw new Error("save failed");
  });
}
