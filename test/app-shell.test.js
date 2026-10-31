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
