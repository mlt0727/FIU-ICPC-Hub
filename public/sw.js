// Service worker: a small script the phone keeps running in the background for this site.
// It is what receives a push and shows it, even when the app is closed.

// A push arrived: show it. The server sends JSON { title, body, url }.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "FIU ICPC Hub", {
      body: data.body || "",
      icon: "/icons/192",
      data: { url: data.url || "/" },
    }),
  );
});

// The notification was tapped: open the page it points to (reuse an open window if there is one).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url === url);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
