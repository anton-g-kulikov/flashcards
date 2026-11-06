// Search engines find the site through robots.txt and the sitemap. Only pages that show something
// when signed out belong in the sitemap; My Cards shows just the sign-in screen, so it also asks
// not to be indexed. Each public page names its canonical address, because the same files answer
// on web.app and firebaseapp.com.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import { pageName, sitemap as writtenSitemap, wordListPages } from "../scripts/make-word-lists.js";

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
    assert.deepEqual(urls.slice(0, 2), [`${ORIGIN}/`, `${ORIGIN}/privacy.html`]);
    assert.equal(sitemap, writtenSitemap(Object.keys(wordListPages())));
  });

  it("lists only files that exist", () => {
    for (const url of urls) {
      const path = new URL(url).pathname;
      assert.ok(existsSync(join("public", path === "/" ? "index.html" : path)), url);
    }
  });
});

describe("page tags", () => {
  const page = (name) => readFileSync(join("public", name), "utf8");
  const meta = (html, name) =>
    html.match(new RegExp(`<meta\\s+(?:property|name)="${name}"\\s+content="([^"]+)"`))?.[1];

  it("gives each public page a canonical address", () => {
    assert.ok(page("index.html").includes(`<link rel="canonical" href="${ORIGIN}/" />`));
    assert.ok(page("privacy.html").includes(`<link rel="canonical" href="${ORIGIN}/privacy.html" />`));
  });

  it("keeps My Cards out of the index, without blocking the crawler that must read that", () => {
    assert.equal(meta(page("vocabulary-manager.html"), "robots"), "noindex");
    assert.doesNotMatch(readFileSync("public/robots.txt", "utf8"), /vocabulary-manager/);
  });

  it("keeps the study page's title when the translations are applied", () => {
    const title = page("index.html").match(/<title>([^<]+)<\/title>/)[1];
    const i18n = readFileSync("public/src/ui/i18n.js", "utf8");
    assert.ok(i18n.includes(`"app.pageTitle": "${title}"`), "the English app.pageTitle differs");
    assert.equal(i18n.match(/"app\.pageTitle":/g).length, 3, "one title per language");
    assert.ok(title.length <= 60, "search results cut longer titles");
    assert.equal(meta(page("index.html"), "og:title"), title);
  });

  it("gives link previews the page's description and a picture that exists", () => {
    const html = page("index.html");
    assert.equal(meta(html, "og:description"), meta(html, "description"));
    const image = new URL(meta(html, "og:image"));
    assert.equal(image.origin, ORIGIN);
    assert.ok(existsSync(join("public", image.pathname)), image.pathname);
  });

  it("names the site in valid JSON-LD", () => {
    const json = page("index.html").match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    const data = JSON.parse(json);
    assert.equal(data["@type"], "WebSite");
    assert.equal(data.url, `${ORIGIN}/`);
  });
});

// The public page of each starter collection, written by scripts/make-word-lists.js
describe("word list pages", () => {
  const { collections } = JSON.parse(readFileSync("public/collections/index.json", "utf8"));
  const pages = wordListPages();
  const onDisk = existsSync("public/words") ? readdirSync("public/words") : [];
  const tag = (html, pattern) => html.match(pattern)?.[1];

  it("exist for every starter collection", () => {
    assert.deepEqual(onDisk.slice().sort(), collections.map(pageName).sort());
  });

  it("match their collections: run node scripts/make-word-lists.js if not", () => {
    for (const [name, html] of Object.entries(pages)) {
      assert.equal(readFileSync(join("public/words", name), "utf8"), html, name);
    }
  });

  it("show every word, escaped", () => {
    for (const entry of collections) {
      const html = pages[pageName(entry)];
      if (html) assert.equal(html.match(/<tr><td lang=/g).length, entry.words, entry.file);
    }
  });

  it("each have their own title and description, short enough for search results", () => {
    const list = Object.values(pages);
    const titles = list.map((html) => tag(html, /<title[^>]*>([^<]+)<\/title>/));
    const descriptions = list.map((html) => tag(html, /name="description" content="([^"]+)"/));
    assert.equal(new Set(titles).size, list.length);
    assert.equal(new Set(descriptions).size, list.length);
    for (const title of titles) assert.ok(title.length <= 60, title);
    for (const description of descriptions) assert.ok(description.length <= 160, description);
  });

  it("name their canonical address, and link only to pages that exist", () => {
    for (const [name, html] of Object.entries(pages)) {
      assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/words/${name}" />`), name);
      for (const [, link] of html.matchAll(/<li><a href="([^"]+)"/g)) {
        assert.ok(pages[link], `${name} links to ${link}`);
      }
    }
  });

  it("have nothing inline, as the Content-Security-Policy requires", () => {
    for (const [name, html] of Object.entries(pages)) {
      assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, name);
      assert.doesNotMatch(html, /\son[a-z]+\s*=|\sstyle\s*=|<style\b/i, name);
    }
  });

  it("carry all their text in every interface language, and the script that shows it", () => {
    for (const [name, html] of Object.entries(pages)) {
      assert.ok(html.includes('<script src="/src/ui/word-list-language.js"></script>'), name);
      const count = (code) => html.match(new RegExp(`data-text-${code}="[^"]+"`, "g")).length;
      assert.equal(count("en"), count("ru"), name);
      assert.equal(count("en"), count("es"), name);
      assert.ok(count("en") >= 7, `${name}: the title, h1, text, button, column names and h2`);
    }
  });

  // What search engines index: they run the page's scripts with an English browser, nothing saved
  describe("word-list-language.js", () => {
    const source = readFileSync("public/src/ui/word-list-language.js", "utf8");
    const run = (saved) => {
      const changed = [];
      const element = { set textContent(text) { changed.push(text); }, getAttribute: (name) => name, setAttribute() {} };
      const root = { lang: "ru" };
      runInNewContext(source, {
        localStorage: { getItem: () => saved },
        document: { documentElement: root, querySelectorAll: () => [element] },
      });
      return { changed, lang: root.lang };
    };

    it("leaves a page as written when no language is saved, whatever the browser's", () => {
      assert.deepEqual(run(null), { changed: [], lang: "ru" });
      assert.doesNotMatch(source, /navigator/);
    });

    it("shows the saved language, and ignores anything else", () => {
      assert.deepEqual(run("es"), { changed: ["data-text-es"], lang: "es" });
      assert.deepEqual(run("de"), { changed: [], lang: "ru" });
    });

    it("reads the key the app saves, and the app saves the language in use", () => {
      const key = readFileSync("public/src/ui/i18n.js", "utf8").match(/STORAGE_KEY = "([^"]+)"/)[1];
      assert.ok(source.includes(`"${key}"`));
      assert.ok(readFileSync("public/src/core/page.js", "utf8").includes("I18n.remember();"));
    });
  });

  it("are linked from the landing page's table", () => {
    const html = readFileSync("public/index.html", "utf8");
    for (const entry of collections) {
      assert.ok(html.includes(`<td><a href="words/${pageName(entry)}">${entry.name}</a></td>`), entry.name);
    }
  });
});
