const CACHE_NAME = "resyin-app-v2";
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") return caches.match("/");
      return Response.error();
    }
  })());
});

self.addEventListener("push", (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      tag: data.tag || "notification",
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    };

    const tasks = [self.registration.showNotification(data.title || "RESYIN Publications", options)];
    if (typeof data.data?.badgeCount === "number" && self.navigator) {
      const count = data.data.badgeCount;
      if (count > 0 && typeof self.navigator.setAppBadge === "function") tasks.push(self.navigator.setAppBadge(count));
      if (count <= 0 && typeof self.navigator.clearAppBadge === "function") tasks.push(self.navigator.clearAppBadge());
    }
    event.waitUntil(Promise.all(tasks));
  } catch (error) {
    console.error("Error handling push event:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.link || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === targetUrl);
    return existing?.focus() || self.clients.openWindow?.(targetUrl);
  }));
});
