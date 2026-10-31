// Light, dark, or whatever the device says (the NoChords and What's Next approach).
//
// A per-device preference: "system" is the default and follows the device; the other two are for
// a room the device doesn't know about. Pure: theme-switch.js applies it, and theme-init.js
// applies a saved choice before the page paints. test/theme.test.js checks that theme-init.js
// uses the same storage key and colours.

export const THEME_PREFERENCES = ["system", "light", "dark"];
export const DEFAULT_THEME = "system";
export const THEME_STORAGE_KEY = "flashcards-theme";

// The browser chrome's colour per scheme (the theme-color tags). Keep in step with theme-init.js
export const THEME_COLOR = { light: "#c17743", dark: "#161412" };

// A stored value, or the default when there's nothing usable
export function parseThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : DEFAULT_THEME;
}

// What goes on <html data-theme>. Nothing for "system": the stylesheet answers
// prefers-color-scheme itself, so the page follows the device live with no listener.
export function themeAttribute(preference) {
  return preference === "system" ? null : preference;
}
