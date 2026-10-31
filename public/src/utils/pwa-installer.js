// PWA Installation Handler
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      this.deferredPrompt = e;
      // Show the install button
      this.showInstallButton();
      console.log("PWA install prompt is ready");
    });

    // Listen for the app being installed
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      this.hideInstallButton();
      // Track installation
      if (window.Analytics) {
        window.Analytics.trackEvent("pwa_installed");
      }
    });

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("PWA is running in standalone mode");
      // Track standalone usage
      if (window.Analytics) {
        window.Analytics.trackEvent("pwa_standalone_usage");
      }
    }
  }

  showInstallButton() {
    // Use the existing install button in the header
    const installContainer = document.getElementById("pwa-install-container");
    const installButton = document.getElementById("pwa-install-button");

    if (installContainer && installButton) {
      installContainer.style.display = "block";
      installContainer.classList.add("show");

      // Add click handler if not already added
      if (!installButton.hasAttribute("data-handler-added")) {
        installButton.addEventListener("click", () => {
          this.installApp();
        });
        installButton.setAttribute("data-handler-added", "true");
      }
    }
  }

  hideInstallButton() {
    const installContainer = document.getElementById("pwa-install-container");
    if (installContainer) {
      installContainer.style.display = "none";
      installContainer.classList.remove("show");
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      if (window.Analytics) {
        window.Analytics.trackEvent("pwa_install_accepted");
      }
    } else {
      console.log("User dismissed the install prompt");
      if (window.Analytics) {
        window.Analytics.trackEvent("pwa_install_dismissed");
      }
    }

    // Clear the deferredPrompt
    this.deferredPrompt = null;
    this.hideInstallButton();
  }
}

// Initialize PWA installer when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PWAInstaller();
});
