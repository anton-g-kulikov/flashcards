// Set-up every app page shares: the service worker, analytics and its cookie note, the
// appearance switch and the version in the footer.
import { VERSION } from "./version.js";
import { I18n } from "../ui/i18n.js";
import "../ui/theme-switch.js";
import "../ui/analytics-note.js";

// The service worker keeps a copy of the app for offline use. It never reloads the page: a new
// worker replaces the old cache when it activates, and the next visit picks the update up.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

function showVersion() {
  const footerVersion = document.getElementById("footer-version");
  if (footerVersion) footerVersion.textContent = I18n.t("footer.version", { version: VERSION });
}
showVersion();
document.addEventListener("i18n-changed", showVersion);
