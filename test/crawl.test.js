// Search engines find the site through robots.txt and the sitemap. Only pages that show something
// when signed out belong in the sitemap; My Cards shows just the sign-in screen.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const ORIGIN = "https://yourflashcards.app";

describe("robots.txt", () => {
  const robots = existsSync("public/robots.txt") ? readFileSync("public/robots.txt", "utf8") : "";

  it("allows every crawler", () => {
    assert.match(robots, /^User-agent: \*$/m);
    assert.doesNotMatch(robots, /^Disallow: \/$/m);
  });

  it("names the sitemap", () => {
    assert.match(robots, new RegExp(`^Sitemap: ${ORIGIN}/sitemap\\.xml$`, "m"));
  });
});

describe("sitemap.xml", () => {
  const sitemap = existsSync("public/sitemap.xml") ? readFileSync("public/sitemap.xml", "utf8") : "";
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);

  it("lists the public pages", () => {
    assert.deepEqual(urls, [`${ORIGIN}/`, `${ORIGIN}/privacy.html`]);
  });

  it("lists only files that exist", () => {
    for (const url of urls) {
      const path = new URL(url).pathname;
      assert.ok(existsSync(join("public", path === "/" ? "index.html" : path)), url);
    }
  });
});
