// Service Worker for the Flashcards App
// Named after the app's version (src/core/version.js); test/app-shell.test.js checks they match
// and that every file of the app is listed here.
const CACHE_NAME = "flashcards-v1.11.1";
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
  "/src/ui/theme.js",
  "/src/ui/theme-init.js",
  "/src/ui/theme-switch.js",

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

// Install: copy the whole app into this version's cache, straight from the network (the HTTP
// cache may still hold files from an older deploy). If any file fails, the install fails and the
// previous version keeps running; the browser tries again later.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop older versions' caches and take over open pages.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Local development (the emulators) always goes to the network, so edits show up on reload
const DEVELOPMENT = ["localhost", "127.0.0.1"].includes(self.location.hostname);

// Fetch: the app's own files come from this version's cache, with no network round trip, so the
// app opens at once, also offline. Every file of a page comes from the same cache, so a page and
// its scripts always belong to the same deploy. A deploy changes CACHE_NAME, which makes the
// browser install the new version in the background; pages pick it up the next time they open.
// Anything not in the cache (starter collections, other icons) goes to the network first and
// is kept for offline use.
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

  const navigation = request.mode === "navigate";
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = DEVELOPMENT ? null : await cache.match(request, { ignoreSearch: navigation });
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.status === 200 && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        // Offline
        const fallback = await cache.match(request, { ignoreSearch: navigation });
        if (fallback) return fallback;
        if (navigation) return cache.match("/index.html");
        return Response.error();
      }
    })
  );
});
