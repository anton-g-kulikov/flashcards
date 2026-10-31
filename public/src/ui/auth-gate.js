// Auth Gate - Shows the sign-in screen until a Google account is signed in, then the app.
//
// Pages register their start-up with AuthGate.onSignedIn(callback); it runs once, with the user,
// as soon as Firebase reports a signed-in account. Signing out reloads the page so no state from
// one account survives into the next.

class AuthGate {
  static callbacks = [];
  static signedInUser = null;

  static onSignedIn(callback) {
    if (AuthGate.signedInUser) {
      callback(AuthGate.signedInUser);
    } else {
      AuthGate.callbacks.push(callback);
    }
  }

  static init() {
    document.body.classList.add("auth-pending");

    document.addEventListener("cloud-auth-changed", (event) => {
      AuthGate.handleUser(event.detail.user);
    });
    if (window.Cloud && window.Cloud.authResolved) {
      AuthGate.handleUser(window.Cloud.user);
    }

    document.addEventListener("i18n-changed", () => {
      if (AuthGate.signedInUser) AuthGate.renderUserChip(AuthGate.signedInUser);
    });

    const signInBtn = document.getElementById("googleSignInBtn");
    if (signInBtn) {
      signInBtn.addEventListener("click", () => AuthGate.signIn());
    }
  }

  static handleUser(user) {
    document.body.classList.remove("auth-pending");

    if (!user) {
      if (AuthGate.signedInUser) {
        window.location.reload();
        return;
      }
      document.body.classList.add("signed-out");
      document.body.classList.remove("signed-in");
      return;
    }

    if (AuthGate.signedInUser) return;
    AuthGate.signedInUser = user;
    document.body.classList.add("signed-in");
    document.body.classList.remove("signed-out");
    AuthGate.renderUserChip(user);

    const callbacks = AuthGate.callbacks;
    AuthGate.callbacks = [];
    // Loading the collection must never hang silently: after 15 seconds, or on any error,
    // the page says so and offers a retry (an alert() can be suppressed by the browser).
    const slow = setTimeout(() => AuthGate.showLoadProblem(I18n.t("auth.loadSlow")), 15000);
    Promise.all(callbacks.map((callback) => Promise.resolve().then(() => callback(user))))
      .then(() => {
        clearTimeout(slow);
        document.getElementById("loadProblem")?.remove();
      })
      .catch((error) => {
        clearTimeout(slow);
        console.error("Error starting the app:", error);
        AuthGate.showLoadProblem(`${I18n.t("auth.loadFailed")} (${error.message})`);
      });
  }

  static showLoadProblem(text) {
    let panel = document.getElementById("loadProblem");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "loadProblem";
      panel.className = "notice load-problem";
      panel.setAttribute("role", "alert");
      const message = document.createElement("p");
      const retry = document.createElement("button");
      retry.className = "primary-btn";
      retry.textContent = I18n.t("auth.retry");
      retry.addEventListener("click", () => window.location.reload());
      panel.append(message, retry);
      const container = document.querySelector(".app-container");
      container.insertBefore(panel, container.querySelector(".topbar").nextSibling);
    }
    panel.querySelector("p").textContent = text;
  }

  static async signIn() {
    const errorEl = document.getElementById("authError");
    if (errorEl) errorEl.textContent = "";
    try {
      await window.Cloud.signIn();
    } catch (error) {
      // Closing the popup is a change of mind, not an error worth showing.
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        return;
      }
      console.error("Sign-in failed:", error);
      if (errorEl) errorEl.textContent = I18n.t("auth.signInFailed", { error: error.message });
    }
  }

  static renderUserChip(user) {
    const chip = document.getElementById("userChip");
    if (!chip) return;

    chip.innerHTML = "";
    const name = user.displayName || user.email || I18n.t("auth.signedIn");

    // Just the portrait; the name shows on hover. Accounts without a photo get their initial.
    let avatar;
    if (user.photoURL) {
      avatar = document.createElement("img");
      avatar.src = user.photoURL;
      avatar.alt = name;
      avatar.referrerPolicy = "no-referrer";
    } else {
      avatar = document.createElement("span");
      avatar.className = "user-initial";
      avatar.textContent = name.trim().charAt(0).toUpperCase();
      avatar.setAttribute("aria-label", name);
    }
    avatar.classList.add("user-avatar");
    avatar.title = user.email ? `${name} (${user.email})` : name;
    chip.appendChild(avatar);

    const signOutBtn = document.createElement("button");
    signOutBtn.className = "sign-out-btn";
    signOutBtn.title = I18n.t("auth.signOut");
    signOutBtn.setAttribute("aria-label", I18n.t("auth.signOut"));
    signOutBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>`;
    signOutBtn.addEventListener("click", () => window.Cloud.signOut());
    chip.appendChild(signOutBtn);
  }
}

window.AuthGate = AuthGate;
document.addEventListener("DOMContentLoaded", () => AuthGate.init());
