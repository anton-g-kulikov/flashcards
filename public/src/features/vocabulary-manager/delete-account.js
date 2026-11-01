// "Delete my account" at the foot of My Cards: removes every collection, the progress and the
// sign-in (Cloud.deleteAccount), after a second tap. Signing out reloads the page onto the
// sign-in screen, which then says the account is gone (auth-gate.js reads the flag set here).
import { Cloud } from "../../core/cloud.js";
import { I18n } from "../../ui/i18n.js";
import { confirmOnSecondTap } from "../../ui/confirm-button.js";

export const DELETED_FLAG = "flashcards-account-deleted";

export function initDeleteAccount() {
  const button = document.getElementById("deleteAccountBtn");
  const status = document.getElementById("deleteAccountStatus");
  if (!button) return;

  button.addEventListener("click", async () => {
    if (!confirmOnSecondTap(button, I18n.t("account.deleteConfirm"))) return;
    button.disabled = true;
    status.textContent = I18n.t("account.deleting");
    try {
      sessionStorage.setItem(DELETED_FLAG, "1");
      await Cloud.deleteAccount();
      // The sign-out that follows reloads the page
    } catch (error) {
      sessionStorage.removeItem(DELETED_FLAG);
      button.disabled = false;
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        status.textContent = "";
        return;
      }
      const reason =
        error.code === "auth/popup-blocked" || error.code === "auth/requires-recent-login"
          ? I18n.t("account.signInAgain")
          : error.message;
      status.textContent = I18n.t("account.deleteFailed", { error: reason });
    }
  });
}
