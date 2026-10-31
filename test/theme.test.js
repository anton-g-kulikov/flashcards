// The appearance setting: the pure choices, and the pre-paint script agreeing with them.
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME,
  THEME_COLOR,
  THEME_STORAGE_KEY,
  parseThemePreference,
  themeAttribute,
} from "../public/src/ui/theme.js";

describe("theme preference", () => {
  it("defaults to following the device", () => {
    assert.equal(DEFAULT_THEME, "system");
    assert.equal(parseThemePreference(null), "system");
    assert.equal(parseThemePreference("purple"), "system");
    assert.equal(parseThemePreference("dark"), "dark");
  });

  it("puts data-theme on the page only for a fixed choice", () => {
    assert.equal(themeAttribute("system"), null);
    assert.equal(themeAttribute("light"), "light");
    assert.equal(themeAttribute("dark"), "dark");
  });
});

describe("pre-paint script and pages", () => {
  const init = readFileSync("public/src/ui/theme-init.js", "utf8");
  const css = readFileSync("public/src/ui/styles.css", "utf8");

  it("uses the same storage key and colours as theme.js", () => {
    assert.ok(init.includes(`"${THEME_STORAGE_KEY}"`));
    for (const color of Object.values(THEME_COLOR)) assert.ok(init.includes(color), color);
  });

  it("keeps the dark page background in step with the browser chrome colour", () => {
    assert.ok(css.includes(`--color-bg: ${THEME_COLOR.dark};`));
  });

  for (const page of ["index.html", "vocabulary-manager.html", "privacy.html"]) {
    it(`${page} applies a saved choice before its stylesheet, with a theme-color per scheme`, () => {
      const html = readFileSync(`public/${page}`, "utf8");
      const script = html.indexOf('<script src="src/ui/theme-init.js"></script>');
      assert.ok(script > 0 && script < html.indexOf("src/ui/styles.css"));
      assert.ok(script > html.indexOf('data-scheme="dark"'), "the tags come before the script");
      for (const [scheme, color] of Object.entries(THEME_COLOR)) {
        assert.ok(html.includes(`content="${color}" media="(prefers-color-scheme: ${scheme})"`));
      }
    });
  }
});
