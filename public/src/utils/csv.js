// CSV for collections: `word,translation`, or language codes for those headers (`es,en`), which
// also set the collection's languages. UTF-8, RFC 4180 quoting. Reading also takes tab-separated
// files and Anki's plain text export.
//
// Plain functions, also imported by the tests. Reading is forgiving: a BOM, CRLF line endings, a
// missing header or extra columns are all fine.

import { LANGUAGES, TRANSLATION_MAX, WORD_MAX, languagePair, languageValue } from "../core/card-data.js";

export const MAX_ROWS = 5000;

// Splits CSV text into rows of fields, honouring quoted fields with separators, quotes and newlines.
export function parse(text, separator = ",") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = String(text).replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

// Anki's plain text export starts with lines like `#separator:tab` and `#html:true`; `#guid column:1`
// and the like say which columns aren't fields. See docs.ankiweb.net/importing/text-files.html
const ANKI_LINE = /^#(separator|html|tags|columns|notetype|deck|(?:notetype|deck|tags|guid) column):(.*)(?:\r?\n|$)/i;
const SEPARATORS = { tab: "\t", comma: ",", semicolon: ";", space: " ", pipe: "|", colon: ":" };

// What a file's first lines say about it, and the rest of the text. Without a stated separator, a
// tab in the first line means a tab-separated file.
function readFormat(text) {
  let body = String(text).replace(/^\uFEFF/, "");
  const format = { anki: false, html: false, skipColumns: [] };
  let separator = "";
  let line;
  while ((line = body.match(ANKI_LINE))) {
    const key = line[1].toLowerCase();
    const value = line[2].trim();
    if (key === "separator") separator = SEPARATORS[value.toLowerCase()] ?? value;
    if (key === "html") format.html = value.toLowerCase() === "true";
    if (key.endsWith(" column")) format.skipColumns.push(Number(value) - 1);
    format.anki = true;
    body = body.slice(line[0].length);
  }
  if (separator.length !== 1) separator = body.split(/\r?\n/, 1)[0].includes("\t") ? "\t" : ",";
  return { ...format, separator, body };
}

const ENTITIES = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeEntity(entity, name) {
  if (name[0] !== "#") return ENTITIES[name.toLowerCase()];
  const code = /^#x/i.test(name) ? parseInt(name.slice(2), 16) : Number(name.slice(1));
  return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
}

// An Anki field as plain words: no sound references, and for a file with HTML no markup. This only
// tidies the text; card text always reaches the page as text, whatever it holds.
function ankiText(field, html) {
  const text = field.replace(/\[sound:[^\]]*\]/g, " ");
  if (!html) return text;
  return text
    .replace(/<br\s*\/?>|<\/(?:div|p|li)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, decodeEntity)
    .replace(/\s+/g, " ");
}

const namesColumn = (cell, name) => cell === name || LANGUAGES.includes(cell);

// Turns CSV text into cards. Uses the `word` and `translation` columns when there is a header,
// otherwise the first two columns. A header may give a language code in place of either name
// (`es,en`, `es,translation`), and `language` then holds the pair. Both cells must name a column,
// so a first row like `es,yes` is a word. An Anki export has no header: its first two fields are
// the word and translation. Rows without a word and repeated words are skipped, and
// rows past MAX_ROWS are left out; `shortened` counts words or translations too long to keep
// whole (they are cut when saved). The counts let an import tell the user.
export function readCards(text) {
  const { anki, html, skipColumns, separator, body } = readFormat(text);
  const nextField = (index) => (skipColumns.includes(index) ? nextField(index + 1) : index);
  const field = (value) => (anki ? ankiText(value, html) : value).trim();

  let rows = parse(body, separator);
  let wordIndex = nextField(0);
  let translationIndex = nextField(wordIndex + 1);
  let language = "";

  const header = (rows[0] || []).map((value) => value.trim().toLowerCase());
  if (namesColumn(header[0], "word") && namesColumn(header[1], "translation")) {
    language = languageValue(languagePair(`${header[0]}-${header[1]}`));
    rows = rows.slice(1);
  } else if (header.includes("word")) {
    wordIndex = header.indexOf("word");
    translationIndex = header.indexOf("translation");
    rows = rows.slice(1);
  }

  const seen = new Set();
  const cards = [];
  let skipped = 0;
  let truncated = 0;
  let shortened = 0;
  for (const row of rows) {
    const word = field(row[wordIndex] || "");
    const translation = translationIndex >= 0 ? field(row[translationIndex] || "") : "";
    const key = word.toLowerCase();
    if (!word || seen.has(key)) {
      skipped++;
    } else if (cards.length >= MAX_ROWS) {
      truncated++;
    } else {
      seen.add(key);
      cards.push({ word, translation });
      if (word.length > WORD_MAX || translation.length > TRANSLATION_MAX) shortened++;
    }
  }
  return { cards, skipped, truncated, shortened, language };
}

export function toCards(text) {
  return readCards(text).cards;
}

function quote(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Cards to CSV text with a header, naming the languages where they are set. The BOM makes Excel
// read it as UTF-8.
export function fromCards(cards, language = "") {
  const { word, translation } = languagePair(language);
  const header = `${word || "word"},${translation || "translation"}`;
  const lines = [header, ...cards.map((c) => `${quote(c.word)},${quote(c.translation)}`)];
  return "﻿" + lines.join("\n") + "\n";
}

// A collection name as a safe file name.
export function fileName(name) {
  const base = String(name || "collection")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${base || "collection"}.csv`;
}

