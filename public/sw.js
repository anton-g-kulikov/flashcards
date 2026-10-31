// Service Worker for the Flashcards App
const CACHE_NAME = "flashcards-v1.6.1";
const urlsToCache = [
  // Main pages
  "/",
  "/index.html",
  "/vocabulary-manager.html",

  // Core application files
  "/src/core/cloud.js",
  "/src/core/core.js",

  // UI files
  "/src/ui/styles.css",
  "/src/ui/i18n.js",
  "/src/ui/auth-gate.js",
  "/src/ui/confirm-button.js",
  "/src/ui/icons.js",
  "/src/ui/ui-helpers.js",

  // Features
  "/src/features/flashcards/flashcard-mode.js",
  "/src/features/flashcards/quiz-mode.js",
  "/src/features/stats/stats-manager.js",
  "/src/features/vocabulary-manager/word-manager.js",

  // Utilities
  "/src/utils/analytics.js",
  "/src/utils/pwa-installer.js",
  "/src/utils/reset-progress.js",
  "/src/utils/cache-manager.js",
  "/src/utils/version-sync.js",
  "/src/utils/shuffle-utils.js",
  "/src/utils/csv.js",
  "/src/utils/script.js",

  // PWA files
  "/manifest.json",

  // Essential icons
  "/icons/ios/16.png?v=2",
  "/icons/ios/32.png?v=2",
  "/icons/ios/152.png?v=2",
  "/icons/ios/167.png?v=2",
  "/icons/ios/180.png?v=2",
  "/icons/ios/192.png?v=2",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        // Straight from the network: the HTTP cache may still hold files from an older deploy
        return cache.addAll(
          urlsToCache.map((url) => new Request(url, { cache: "reload" }))
        );
      })
      .then(() => {
        console.log("Service Worker: All files cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Cache failed", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("Service Worker: Activated and claiming clients");

      // Notify all clients about the update
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "CACHE_UPDATED",
            cacheName: CACHE_NAME,
          });
        });
      });
    })
  );
});

// Fetch event - serve from cache with network fallback
// Fetch: network first, cache as fallback, for every same-origin GET.
//
// Serving scripts from the cache first meant that, for one load after a deploy, a page fetched
// fresh from the network could run with an older cached script, and break. Going to the network
// first keeps every file of a page from the same deploy; the cache only answers offline. The
// server's no-cache headers make these requests cheap revalidations.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Cross-origin requests (Firebase SDK, Google sign-in, Firestore, Analytics) are not ours
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }
  // Firebase Hosting's reserved URLs (the sign-in handler) must always come from the network
  if (new URL(request.url).pathname.startsWith("/__/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Offline navigation to a page we never cached: fall back to the study page
          if (request.mode === "navigate") return caches.match("/index.html");
          return Response.error();
        })
      )
  );
});

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

// Message handler for communication with the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log("Service Worker: Cache cleared on request");
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "CACHE_CLEARED",
            });
          });
        });
      })
    );
  }
});

function doBackgroundSync() {
  // Here you can implement background sync logic
  // For example, sync user progress when back online
  return new Promise((resolve) => {
    console.log("Service Worker: Background sync triggered");
    resolve();
  });
}

// Push notifications (optional - can be implemented later)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/ios/192.png?v=2",
      badge: "/icons/android/android-launchericon-72-72.png?v=2",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
