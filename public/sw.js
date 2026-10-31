// Service Worker for the Flashcards App
// Named after the app's version (src/core/version.js); test/app-shell.test.js checks they match
// and that every file of the app is listed here.
const CACHE_NAME = "flashcards-v1.10.0";
const urlsToCache = [
  // Pages
  "/",
  "/index.html",
  "/vocabulary-manager.html",
  "/privacy.html",

  // Page entry points
  "/src/study.js",
  "/src/my-cards.js",

  // Core
  "/src/core/card-data.js",
  "/src/core/cloud.js",
  "/src/core/page.js",
  "/src/core/version.js",

  // UI
  "/src/ui/styles.css",
  "/src/ui/i18n.js",
  "/src/ui/auth-gate.js",
  "/src/ui/confirm-button.js",

  // Features
  "/src/features/flashcards/flashcard-mode.js",
  "/src/features/flashcards/quiz-mode.js",
  "/src/features/study/message-card.js",
  "/src/features/study/progress.js",
  "/src/features/study/quiz-logic.js",
  "/src/features/vocabulary-manager/word-manager.js",

  // Utilities
  "/src/utils/analytics.js",
  "/src/utils/csv.js",
  "/src/utils/pwa-installer.js",
  "/src/utils/shuffle-utils.js",

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
    ])
  );
});

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
