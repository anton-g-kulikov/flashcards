// "Install App" button, for browsers that offer an install prompt (Chrome, Edge, Android).
import { Analytics } from "./analytics.js";

export function initInstallPrompt() {
  const container = document.getElementById("pwa-install-container");
  const button = document.getElementById("pwa-install-button");
  if (!container || !button) return;
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Our own button instead of the browser's mini-infobar
    event.preventDefault();
    deferredPrompt = event;
    container.classList.remove("hidden");
  });

  button.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    Analytics.event("pwa_install_prompt", { outcome });
    deferredPrompt = null;
    container.classList.add("hidden");
  });

  window.addEventListener("appinstalled", () => {
    container.classList.add("hidden");
    Analytics.event("pwa_installed");
  });

  if (window.matchMedia("(display-mode: standalone)").matches) {
    Analytics.event("pwa_standalone_usage");
  }
}
