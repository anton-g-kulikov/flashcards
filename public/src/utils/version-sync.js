// Auto-Version Sync Utility
// This script can automatically sync version numbers across your PWA files

class VersionSync {
  static async syncVersions() {
    try {
      let version = null;

      // Method 1: Try to get version from service worker cache (only works with HTTPS/HTTP)
      if ("caches" in window && window.location.protocol !== "file:") {
        try {
          const cacheNames = await caches.keys();
          const dgtCache = cacheNames.find((name) =>
            name.startsWith("flashcards-v")
          );
          if (dgtCache) {
            version = dgtCache.replace("flashcards-v", "");
            console.log(`Found cache version: ${version}`);
          }
        } catch (cacheError) {
          console.log("Cache API not available, trying fallback method");
        }
      }

      // Method 2: Fallback - fetch and parse service worker file
      if (!version) {
        try {
          const response = await fetch("/sw.js");
          if (response.ok) {
            const swContent = await response.text();
            const match = swContent.match(
              /CACHE_NAME\s*=\s*["']flashcards-v([^"']+)["']/
            );
            if (match) {
              version = match[1];
              console.log(`Extracted version from service worker: ${version}`);
            }
          }
        } catch (fetchError) {
          console.log("Could not fetch service worker, using fallback");
        }
      }

      // Method 3: Final fallback - hardcoded version (extracted from SW)
      if (!version) {
        version = "1.0.0";
        console.log(`Using fallback version: ${version}`);
      }

      if (version) {
        // Update footer version display
        const footerVersion = document.getElementById("footer-version");
        if (footerVersion) {
          footerVersion.textContent = `Version: ${version}`;
        }

        // Update any version badges
        const versionBadges = document.querySelectorAll(".version-badge");
        versionBadges.forEach((badge) => {
          badge.textContent = `v${version}`;
        });

        console.log(`Version synced to: ${version}`);
        return version;
      }
    } catch (error) {
      console.error("Failed to sync versions:", error);
    }
    return null;
  }

  static async checkForUpdates() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        if (registration.waiting) {
          console.log(
            "Update available! Consider showing update notification."
          );
          return true;
        }
      }
    }
    return false;
  }
}

// Auto-sync versions when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Add a small delay to ensure all elements are loaded
  setTimeout(() => {
    VersionSync.syncVersions();
  }, 100);
});

// Make available globally for debugging
window.VersionSync = VersionSync;
