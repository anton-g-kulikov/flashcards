// The cookie note at the foot of the pages: what Analytics is for, and a way out of it (or back
// in). Rendered into every [data-analytics-note] element; the choice is saved on this device.
import { I18n } from "./i18n.js";
import { analyticsAllowed, setAnalyticsAllowed } from "../utils/analytics.js";

function render() {
  const allowed = analyticsAllowed();
  document.querySelectorAll("[data-analytics-note]").forEach((note) => {
    note.classList.add("analytics-note");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "link-btn";
    button.textContent = I18n.t(allowed ? "cookies.turnOff" : "cookies.turnOn");
    button.addEventListener("click", () => {
      setAnalyticsAllowed(!allowed);
      render();
    });
    note.replaceChildren(I18n.t(allowed ? "cookies.note" : "cookies.off") + " ", button);
  });
}

render();
document.addEventListener("i18n-changed", render);
