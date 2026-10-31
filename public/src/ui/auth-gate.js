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
    callbacks.forEach((callback) => {
      Promise.resolve(callback(user)).catch((error) => {
        console.error("Error starting the app:", error);
        alert("Could not load your collection. Please check your connection and reload.");
      });
    });
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
      if (errorEl) errorEl.textContent = `Sign-in failed: ${error.message}`;
    }
  }

  static renderUserChip(user) {
    const chip = document.getElementById("userChip");
    if (!chip) return;

    chip.innerHTML = "";
    if (user.photoURL) {
      const avatar = document.createElement("img");
      avatar.className = "user-avatar";
      avatar.src = user.photoURL;
      avatar.alt = "";
      avatar.referrerPolicy = "no-referrer";
      chip.appendChild(avatar);
    }

    const name = document.createElement("span");
    name.className = "user-name";
    name.textContent = user.displayName || user.email || "Signed in";
    chip.appendChild(name);

    const signOutBtn = document.createElement("button");
    signOutBtn.className = "sign-out-btn";
    signOutBtn.textContent = "Sign out";
    signOutBtn.addEventListener("click", () => window.Cloud.signOut());
    chip.appendChild(signOutBtn);
  }
}

window.AuthGate = AuthGate;
document.addEventListener("DOMContentLoaded", () => AuthGate.init());
