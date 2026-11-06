// Writes a public page for each starter collection to public/words/, so a search for "Spanish A1
// verbs" can find the site: the full word list as plain HTML, in the language of the people who
// would search for it (the translation's language). It also lists the pages in sitemap.xml and
// links them from the landing page's table. test/crawl.test.js fails if any of this is out of date.
// Run from the repository root after changing public/collections/:
//   node scripts/make-word-lists.js
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { languagePair } from "../public/src/core/card-data.js";
import { readCards } from "../public/src/utils/csv.js";

const ORIGIN = "https://yourflashcards.app";
const DIR = "public/words";
const SITEMAP_FIXED = ["/", "/privacy.html"];

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const languageName = (code, reader) => new Intl.DisplayNames([reader], { type: "language" }).of(code);

export const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Russian needs each name in two cases; a new language or word type goes here
const RU_LANGUAGES = { en: ["Английские", "английских"] };
const RU_KINDS = {
  Nouns: ["существительные", "существительных"],
  Verbs: ["глаголы", "глаголов"],
  Adjectives: ["прилагательные", "прилагательных"],
  Adverbs: ["наречия", "наречий"],
};

// The page's words, by the language it is written in
const READERS = {
  en: {
    heading: ({ word, level, kind }) => `${languageName(word, "en")} ${level} ${kind}`,
    title: ({ word, translation, level, kind, count }) =>
      `${count} ${languageName(word, "en")} ${level} ${kind} with ${languageName(translation, "en")} Translations`,
    description: ({ word, translation, level, kind, count, examples }) =>
      `${count} ${languageName(word, "en")} ${level} ${kind.toLowerCase()} with ${languageName(translation, "en")} ` +
      `translations: ${examples.join(", ")} and more. Study them as flashcards with spaced repetition.`,
    pitch: "Study these words as flashcards and quizzes, with spaced repetition. Sign in, then add this list from My Cards in one tap.",
    action: "Study these words",
    back: "Back to YourFlashCards",
    more: ({ word }) => `More ${languageName(word, "en")} word lists`,
  },
  ru: {
    heading: ({ word, level, kind }) => `${RU_LANGUAGES[word][0]} ${RU_KINDS[kind][0]} ${level}`,
    title: ({ word, level, kind, count }) =>
      `${count} ${RU_LANGUAGES[word][1]} ${RU_KINDS[kind][1]} ${level} с переводом на русский`,
    description: ({ word, level, kind, count, examples }) =>
      `${count} ${RU_LANGUAGES[word][1]} ${RU_KINDS[kind][1]} ${level} с переводом на русский: ` +
      `${examples.join(", ")} и другие. Учите их по карточкам с интервальным повторением.`,
    pitch: "Учите эти слова по карточкам и в тестах, с интервальным повторением. Войдите и добавьте этот список одним нажатием в разделе «Мои карточки».",
    action: "Учить эти слова",
    back: "Назад в YourFlashCards",
    more: ({ word }) => `Другие списки ${RU_LANGUAGES[word][1]} слов`,
  },
};

export const pageName = ({ name }) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;

function describeCollection(entry, cards) {
  const { word, translation } = languagePair(entry.language);
  const reader = READERS[translation];
  if (!reader) throw new Error(`${entry.file}: add the page's words for "${translation}" to READERS`);
  return {
    word,
    translation,
    reader,
    level: entry.level,
    kind: entry.name.split(" · ")[1],
    count: cards.length,
    examples: cards.slice(0, 3).map((card) => card.word),
  };
}

function renderPage(entry, cards, siblings) {
  const facts = describeCollection(entry, cards);
  const { reader, word, translation } = facts;
  const url = `${ORIGIN}/words/${pageName(entry)}`;
  const title = escapeHtml(reader.title(facts));
  const description = escapeHtml(reader.description(facts));
  const rows = cards
    .map((card) => `            <tr><td lang="${word}">${escapeHtml(card.word)}</td><td>${escapeHtml(card.translation)}</td></tr>`)
    .join("\n");
  const links = siblings
    .map(({ entry: other, cards: otherCards }) => {
      const label = reader.heading(describeCollection(other, otherCards));
      return `          <li><a href="${pageName(other)}">${escapeHtml(label)}</a></li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<!-- Written by scripts/make-word-lists.js from ${entry.file}. Change those, not this. -->
<html lang="${translation}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="YourFlashCards" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ORIGIN}/icons/share.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#c17743" media="(prefers-color-scheme: light)" data-scheme="light" />
    <meta name="theme-color" content="#161412" media="(prefers-color-scheme: dark)" data-scheme="dark" />
    <!-- A saved light or dark choice, applied before the page paints -->
    <script src="/src/ui/theme-init.js"></script>
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/ios/32.png?v=2" />
    <link rel="apple-touch-icon" href="/icons/ios/180.png?v=2" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap"
    />
    <link rel="stylesheet" href="/src/ui/styles.css" />
  </head>
  <body>
    <div class="app-container">
      <header class="topbar">
        <a href="/" class="icon-btn" aria-label="${reader.back}" title="${reader.back}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </a>
        <p class="topbar-title">YourFlashCards</p>
      </header>

      <article class="panel prose word-list">
        <h1>${escapeHtml(reader.heading(facts))}</h1>
        <p>${reader.pitch}</p>
        <a href="/" class="primary-btn word-list-action">${reader.action}</a>
        <table class="word-table">
          <thead>
            <tr>
              <th scope="col">${capitalize(languageName(word, translation))}</th>
              <th scope="col">${capitalize(languageName(translation, translation))}</th>
            </tr>
          </thead>
          <tbody>
${rows}
          </tbody>
        </table>
        <h2>${escapeHtml(reader.more(facts))}</h2>
        <ul>
${links}
        </ul>
      </article>
    </div>
  </body>
</html>
`;
}

// Every page, keyed by file name. A collection whose CSV isn't there yet has no page.
export function wordListPages() {
  const { collections } = JSON.parse(readFileSync("public/collections/index.json", "utf8"));
  const lists = collections
    .filter((entry) => existsSync(join("public/collections", entry.file)))
    .map((entry) => ({ entry, cards: readCards(readFileSync(join("public/collections", entry.file), "utf8")).cards }));
  return Object.fromEntries(
    lists.map(({ entry, cards }) => {
      const siblings = lists.filter((other) => other.entry.language === entry.language && other.entry !== entry);
      return [pageName(entry), renderPage(entry, cards, siblings)];
    })
  );
}

export function sitemap(names) {
  const paths = [...SITEMAP_FIXED, ...names.map((name) => `/words/${name}`)];
  const urls = paths.map((path) => `  <url>\n    <loc>${ORIGIN}${path}</loc>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// The landing table's name cells, plain or already linked, become links to the pages
function linkLandingTable(html, collections, names) {
  return collections.reduce((page, entry) => {
    if (!names.includes(pageName(entry))) return page;
    const cell = new RegExp(`<td>(?:<a [^>]*>)?${entry.name}(?:</a>)?</td>`);
    return page.replace(cell, `<td><a href="words/${pageName(entry)}">${entry.name}</a></td>`);
  }, html);
}

if (process.argv[1]?.endsWith("make-word-lists.js")) {
  const pages = wordListPages();
  const names = Object.keys(pages);
  rmSync(DIR, { recursive: true, force: true });
  mkdirSync(DIR);
  for (const [name, html] of Object.entries(pages)) writeFileSync(join(DIR, name), html);
  writeFileSync("public/sitemap.xml", sitemap(names));
  const { collections } = JSON.parse(readFileSync("public/collections/index.json", "utf8"));
  const landing = readFileSync("public/index.html", "utf8");
  writeFileSync("public/index.html", linkLandingTable(landing, collections, names));
  console.log(`${readdirSync(DIR).length} pages of ${collections.length} collections`);
}
