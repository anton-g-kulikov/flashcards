// The appearance switch: three icons, one lit (like NoChords and What's Next). A cycling button
// would hide where it goes next, and "system" is the state nobody can guess from a sun or a moon
// alone. Rendered into every [data-theme-switch] element; saved on this device only.
import { I18n } from "./i18n.js";
import {
  DEFAULT_THEME,
  THEME_COLOR,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  parseThemePreference,
  themeAttribute,
} from "./theme.js";

const ICONS = {
  // Half sun, half moon: "whatever the device says"
  system:
    '<circle cx="12" cy="12" r="4.5"/><path d="M12 7.5a4.5 4.5 0 0 1 0 9z" fill="currentColor"/>' +
    '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/>',
  light:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  dark: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
};

function stored() {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch (error) {
    return DEFAULT_THEME;
  }
}

function choose(preference) {
  try {
    if (preference === DEFAULT_THEME) localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    // Not saved; it still applies until the page closes
  }

  const attribute = themeAttribute(preference);
  if (attribute) document.documentElement.dataset.theme = attribute;
  else delete document.documentElement.dataset.theme;
  // Each tag keeps its own media query, so "system" needs no listener; a fixed choice paints both
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content = THEME_COLOR[attribute ?? meta.dataset.scheme];
  });
  render();
}

function render() {
  const current = stored();
  document.querySelectorAll("[data-theme-switch]").forEach((container) => {
    container.className = "theme-switch";
    container.setAttribute("role", "radiogroup");
    container.setAttribute("aria-label", I18n.t("theme.label"));
    container.replaceChildren(
      ...THEME_PREFERENCES.map((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "theme-option";
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", String(option === current));
        button.setAttribute("aria-label", I18n.t(`theme.${option}`));
        button.title = I18n.t(`theme.${option}`);
        button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[option]}</svg>`;
        button.addEventListener("click", () => choose(option));
        return button;
      })
    );
  });
}

render();
document.addEventListener("i18n-changed", render);
