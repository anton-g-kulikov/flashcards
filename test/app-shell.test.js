// The service worker's precache list is the app's file list: a file missing from it doesn't work
// offline, and a listed file that doesn't exist makes the worker fail to install. Its cache name
// carries the version shown in the footer.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VERSION } from "../public/src/core/version.js";
import { withEmulators } from "../scripts/dev-config.js";

const sw = readFileSync("public/sw.js", "utf8");
const precached = [...sw.match(/const urlsToCache = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map(
  ([, url]) => url
);

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

describe("service worker", () => {
  it("names its cache after the app's version", () => {
    assert.match(sw, new RegExp(`CACHE_NAME = "flashcards-v${VERSION.replace(/\./g, "\\.")}"`));
  });

  it("precaches every page, script and stylesheet", () => {
    const appFiles = [
      ...readdirSync("public").filter((name) => name.endsWith(".html")),
      ...files("public/src").map((path) => relative("public", path)),
    ].map((path) => `/${path}`);
    const missing = appFiles.filter((path) => !precached.includes(path));
    assert.deepEqual(missing, [], "add these to urlsToCache in public/sw.js");
  });

  it("precaches only files that exist", () => {
    const absent = precached
      .filter((url) => url !== "/")
      .filter((url) => !existsSync(join("public", url.split("?")[0])));
    assert.deepEqual(absent, []);
  });
});

// firebase.json sends a Content-Security-Policy without 'unsafe-inline', so the browser refuses
// inline scripts, on* handler attributes and style attributes in the pages.
describe("content security policy", () => {
  const hosting = JSON.parse(readFileSync("firebase.json", "utf8")).hosting;
  const policies = hosting.headers.flatMap((rule) =>
    rule.headers.filter((h) => h.key === "Content-Security-Policy").map((h) => [rule.source, h.value])
  );

  it("never lets the deployed policy reach local addresses (only `npm run dev` adds the emulators)", () => {
    for (const [, value] of policies) {
      assert.doesNotMatch(value, /127\.0\.0\.1|localhost/);
      const dev = withEmulators(value);
      assert.match(dev, /connect-src [^;]*http:\/\/127\.0\.0\.1:8080 http:\/\/127\.0\.0\.1:9099/);
      assert.match(dev, /frame-src [^;]*http:\/\/127\.0\.0\.1:9099/);
    }
  });

  it("covers every page, with no inline scripts allowed", () => {
    assert.deepEqual(policies.map(([source]) => source).sort(), ["**/*.html", "/"]);
    for (const [, value] of policies) {
      assert.doesNotMatch(value, /unsafe-inline|unsafe-eval/);
      assert.match(value, /object-src 'none'/);
    }
  });

  for (const page of readdirSync("public").filter((name) => name.endsWith(".html"))) {
    it(`${page} has nothing inline`, () => {
      const html = readFileSync(join("public", page), "utf8");
      assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, "inline <script>");
      assert.doesNotMatch(html, /\son[a-z]+\s*=/i, "on* handler attribute");
      assert.doesNotMatch(html, /\sstyle\s*=/i, "style attribute");
      assert.doesNotMatch(html, /<style\b/i, "<style> element");
    });
  }
});

describe("Firebase SDK preloads", () => {
  it("name the same SDK files and version that cloud.js imports", () => {
    const imports = [...readFileSync("public/src/core/cloud.js", "utf8").matchAll(/from "(https:\/\/www\.gstatic\.com\/[^"]+)"/g)]
      .map(([, url]) => url)
      .sort();
    for (const page of ["index.html", "vocabulary-manager.html"]) {
      const preloads = [...readFileSync(join("public", page), "utf8").matchAll(/rel="modulepreload" href="([^"]+)"/g)]
        .map(([, url]) => url)
        .sort();
      assert.deepEqual(preloads, imports, page);
    }
  });
});

describe("iOS launch screens", () => {
  const sizes = readFileSync("scripts/launch-images.txt", "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/).map(Number));

  for (const page of ["index.html", "vocabulary-manager.html"]) {
    it(`${page} links a light and a dark image for every listed screen, and each exists`, () => {
      const html = readFileSync(join("public", page), "utf8");
      for (const [w, h, ratio] of sizes) {
        for (const scheme of ["light", "dark"]) {
          const file = `icons/splash/${w * ratio}x${h * ratio}-${scheme}.png`;
          assert.ok(existsSync(join("public", file)), file);
          assert.ok(
            html.includes(`href="${file}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait) and (prefers-color-scheme: ${scheme})"`),
            `${page}: ${file}`
          );
        }
      }
    });
  }

  it("has no image without a listed screen", () => {
    const expected = new Set(sizes.flatMap(([w, h, r]) => ["light", "dark"].map((s) => `${w * r}x${h * r}-${s}.png`)));
    const extra = readdirSync("public/icons/splash").filter((name) => !expected.has(name));
    assert.deepEqual(extra, []);
  });
});
