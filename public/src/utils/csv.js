// CSV for collections: `word,translation`, UTF-8, RFC 4180 quoting.
//
// Plain functions, also imported by the tests. Reading is forgiving: a BOM, CRLF line endings, a
// missing header or extra columns are all fine.

import { TRANSLATION_MAX, WORD_MAX } from "../core/card-data.js";

export const MAX_ROWS = 5000;

// Splits CSV text into rows of fields, honouring quoted fields with commas, quotes and newlines.
export function parse(text) {
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
    } else if (char === ",") {
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

// Turns CSV text into cards. Uses the `word` and `translation` columns when there is a header,
// otherwise the first two columns. Rows without a word and repeated words are skipped, and
// rows past MAX_ROWS are left out; `shortened` counts words or translations too long to keep
// whole (they are cut when saved). The counts let an import tell the user.
export function readCards(text) {
  let rows = parse(text);
  let wordIndex = 0;
  let translationIndex = 1;

  const header = (rows[0] || []).map((value) => value.trim().toLowerCase());
  if (header.includes("word")) {
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
    const word = (row[wordIndex] || "").trim();
    const translation = translationIndex >= 0 ? (row[translationIndex] || "").trim() : "";
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
  return { cards, skipped, truncated, shortened };
}

export function toCards(text) {
  return readCards(text).cards;
}

function quote(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Cards to CSV text with a header. The BOM makes Excel read it as UTF-8.
export function fromCards(cards) {
  const lines = ["word,translation", ...cards.map((c) => `${quote(c.word)},${quote(c.translation)}`)];
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

