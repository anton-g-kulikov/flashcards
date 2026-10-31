// Service Worker for the Flashcards App
const CACHE_NAME = "flashcards-v1.0.0";
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
  "/src/ui/auth-gate.js",
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
  "/src/utils/script.js",

  // PWA files
  "/manifest.json",

  // Essential icons
  "/icons/ios/16.png",
  "/icons/ios/32.png",
  "/icons/ios/152.png",
  "/icons/ios/167.png",
  "/icons/ios/180.png",
  "/icons/ios/192.png",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(urlsToCache);
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
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests (Firebase SDK, Google sign-in, Firestore)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Firebase Hosting's reserved URLs (the sign-in handler) must always come from the network
  if (new URL(event.request.url).pathname.startsWith("/__/")) {
    return;
  }

  // For navigation requests (HTML pages), always try network first
  // to ensure users get the latest content and service worker updates
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we get a valid response, cache it and return it
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // For other requests, use cache-first strategy but with network update
  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        // If we have a cached version, return it immediately
        if (cachedResponse) {
          // But also try to update the cache in the background
          fetch(event.request)
            .then((networkResponse) => {
              if (
                networkResponse &&
                networkResponse.status === 200 &&
                networkResponse.type === "basic"
              ) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
            })
            .catch(() => {
              // Ignore network errors for background updates
            });

          return cachedResponse;
        }

        // If not cached, fetch from network
        return fetch(event.request).then((fetchResponse) => {
          // Check if we received a valid response
          if (
            !fetchResponse ||
            fetchResponse.status !== 200 ||
            fetchResponse.type !== "basic"
          ) {
            return fetchResponse;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = fetchResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        });
      })
      .catch(() => {
        // If both cache and network fail, return a fallback page for navigation requests
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      })
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
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
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
