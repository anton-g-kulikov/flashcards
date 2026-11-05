// The footer folds away behind a tab on its divider (as in What's Next). It only shows to signed-in
// people and always starts collapsed; opening it is for the moment and isn't remembered. The pages
// start with data-collapsed and inert, so nothing shows before this runs.
import { I18n } from "./i18n.js";

const FOLD_MS = 280; // the .footer-fold transition in styles.css

const footer = document.querySelector(".site-footer");
const toggle = footer?.querySelector(".footer-toggle");
const fold = footer?.querySelector(".footer-fold");

function setCollapsed(collapsed) {
  footer.toggleAttribute("data-collapsed", collapsed);
  fold.inert = collapsed;
  toggle.setAttribute("aria-expanded", String(!collapsed));
  // data-i18n-label keeps the label right through language switches
  toggle.dataset.i18nLabel = collapsed ? "footer.expand" : "footer.collapse";
  toggle.title = I18n.t(toggle.dataset.i18nLabel);
  toggle.setAttribute("aria-label", toggle.title);
}

toggle?.addEventListener("click", () => {
  const opening = footer.hasAttribute("data-collapsed");
  setCollapsed(!opening);
  if (!opening) return;
  // It opens downwards, often past the bottom of the screen
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(
    () => footer.scrollIntoView({ block: "end", behavior: reduced ? "auto" : "smooth" }),
    reduced ? 0 : FOLD_MS
  );
});
