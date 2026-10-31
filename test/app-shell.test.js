// The service worker's precache list is the app's file list: a file missing from it doesn't work
// offline, and a listed file that doesn't exist makes the worker fail to install. Its cache name
// carries the version shown in the footer.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VERSION } from "../public/src/core/version.js";

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
