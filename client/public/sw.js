// eslint-disable-next-line no-unused-vars
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request, {
      cache: "no-store",
      credentials: "same-origin",
    }),
  );
});

/**
 * Handle incoming push notifications
 */
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

    const backgroundTasks = [
      self.registration.showNotification(
        data.title || "RESYIN Publications",
        options,
      ),
    ];

    // The Badging API is exposed on WorkerNavigator (`self.navigator`) in a
    // service worker, not on ServiceWorkerRegistration. This lets the badge
    // update when the installed PWA has no open window.
    if (typeof data.data?.badgeCount === "number" && self.navigator) {
      const count = data.data.badgeCount;
      if (count > 0 && typeof self.navigator.setAppBadge === "function") {
        backgroundTasks.push(self.navigator.setAppBadge(count));
      } else if (count <= 0 && typeof self.navigator.clearAppBadge === "function") {
        backgroundTasks.push(self.navigator.clearAppBadge());
      }
    }

    event.waitUntil(Promise.all(backgroundTasks));
  } catch (error) {
    console.error("Error handling push event:", error);
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.link || "/";
  const targetUrl = new URL(link, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

/**
 * Handle notification close
 */
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
