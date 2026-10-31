/**
 * Cache Management Utility
 * Provides functions to help manage PWA cache updates
 */

class CacheManager {
  /**
   * Force clear all caches and reload the app
   */
  static async forceClearCache() {
    if ("serviceWorker" in navigator && "caches" in window) {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();

        // Delete all caches
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );

        console.log("All caches cleared successfully");

        // Send message to service worker to clear its cache too
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "CLEAR_CACHE",
          });
        }

        // Reload the page
        window.location.reload(true);
      } catch (error) {
        console.error("Failed to clear caches:", error);
      }
    }
  }

  /**
   * Check if service worker is updated and force update if needed
   */
  static async forceServiceWorkerUpdate() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log("Checking for service worker updates...");
          await registration.update();

          if (registration.waiting) {
            // There's a waiting worker, activate it immediately
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        }
      } catch (error) {
        console.error("Failed to update service worker:", error);
      }
    }
  }

  /**
   * Get cache information for debugging
   */
  static async getCacheInfo() {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        console.log("Available caches:", cacheNames);

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          console.log(
            `Cache "${cacheName}" contains ${requests.length} items:`
          );
          requests.forEach((request) => console.log("  -", request.url));
        }
      } catch (error) {
        console.error("Failed to get cache info:", error);
      }
    }
  }

  /**
   * Add a manual refresh button to the page for easier cache clearing
   */
  static addRefreshButton() {
    if (document.getElementById("cache-refresh-btn")) return; // Already exists

    const button = document.createElement("button");
    button.id = "cache-refresh-btn";
    button.textContent = "🔄 Force Refresh Cache";
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: #dc8f64;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    button.onclick = () => {
      if (
        confirm("This will clear all cached data and reload the app. Continue?")
      ) {
        CacheManager.forceClearCache();
      }
    };

    document.body.appendChild(button);
  }

  /**
   * Get current cache version from service worker
   */
  static async getCurrentCacheVersion() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          // Try to get version from cache names
          const cacheNames = await caches.keys();
          const dgtCache = cacheNames.find((name) =>
            name.startsWith("flashcards-v")
          );
          if (dgtCache) {
            console.log("Current cache version:", dgtCache);
            return dgtCache;
          }
        }
      } catch (error) {
        console.error("Failed to get cache version:", error);
      }
    }
    return null;
  }

  /**
   * Show current version info in a nice format
   */
  static async showVersionInfo() {
    const version = await CacheManager.getCurrentCacheVersion();
    const swRegistration = await navigator.serviceWorker.getRegistration();

    console.log(`
📱 Flashcards PWA Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cache Version: ${version || "Unknown"}
Service Worker: ${swRegistration ? "✅ Active" : "❌ Not registered"}
Update Available: ${
      swRegistration?.waiting ? "🔄 Yes (waiting)" : "✅ Up to date"
    }
Offline Ready: ${version ? "✅ Yes" : "❌ No"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    return {
      version,
      hasServiceWorker: !!swRegistration,
      hasUpdate: !!swRegistration?.waiting,
      isOfflineReady: !!version,
    };
  }
}

// Console helpers for debugging
window.CacheManager = CacheManager;

// Add console helpers
console.log(`
🔧 Cache Management Utilities Available:
- CacheManager.showVersionInfo() - Show current PWA status
- CacheManager.forceClearCache() - Clear all caches and reload
- CacheManager.forceServiceWorkerUpdate() - Force SW update
- CacheManager.getCacheInfo() - Show cache contents
- CacheManager.addRefreshButton() - Add refresh button to page

To force a complete refresh when you update the cache version:
CacheManager.forceClearCache()

To check current version and status:
CacheManager.showVersionInfo()
`);
