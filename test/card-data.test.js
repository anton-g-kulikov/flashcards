// The stored card shape.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LANGUAGES,
  MAX_CARDS,
  MAX_CARDS_BYTES,
  cardFields,
  cardsSize,
  languagePair,
  languageValue,
  storedCards,
} from "../public/src/core/card-data.js";

describe("cardFields and storedCards", () => {
  it("keep only the word and translation, trimmed and cut to length", () => {
    assert.deepEqual(cardFields({ word: "  hola ", translation: "x".repeat(600), extra: 1 }), {
      word: "hola",
      translation: "x".repeat(500),
    });
  });

  it("drop list items without an id or a word, and anything that isn't a list", () => {
    assert.deepEqual(storedCards([{ id: "a", word: "uno" }, { id: "b" }, { word: "dos" }, null]), [
      { id: "a", word: "uno", translation: "" },
    ]);
    assert.deepEqual(storedCards(undefined), []);
    assert.deepEqual(storedCards({ a: 1 }), []);
  });
});

describe("cardsSize", () => {
  const card = (word, translation) => ({ id: "x".repeat(20), word, translation });

  it("counts UTF-8 bytes plus one per string, field names included", () => {
    // 20 for the field names, 20 + 1 for the id, 4 + 1 for "ños" (ñ is two bytes), 3 + 1 for "yes"
    assert.equal(cardsSize([card("ños", "yes")]), 20 + 21 + 5 + 4);
  });

  it("leaves 5,000 typical cards far below the limit", () => {
    const typical = Array.from({ length: MAX_CARDS }, () => card("la palabra", "the word, a translation"));
    assert.ok(cardsSize(typical) < MAX_CARDS_BYTES / 2);
  });

  it("puts 5,000 cards of the longest words and translations over it", () => {
    const longest = Array.from({ length: MAX_CARDS }, () => card("w".repeat(200), "t".repeat(500)));
    assert.ok(cardsSize(longest) > MAX_CARDS_BYTES);
  });
});

describe("language pairs", () => {
  it("reads the stored form, with either side optional", () => {
    assert.deepEqual(languagePair("es-en"), { word: "es", translation: "en" });
    assert.deepEqual(languagePair("es-"), { word: "es", translation: "" });
    assert.deepEqual(languagePair("-ru"), { word: "", translation: "ru" });
  });

  it("treats a missing or unknown language as not set", () => {
    assert.deepEqual(languagePair(undefined), { word: "", translation: "" });
    assert.deepEqual(languagePair("xx-en"), { word: "", translation: "en" });
  });

  it("writes the stored form, empty when nothing is set", () => {
    assert.equal(languageValue({ word: "es", translation: "en" }), "es-en");
    assert.equal(languageValue({ word: "es", translation: "" }), "es-");
    assert.equal(languageValue({ word: "", translation: "" }), "");
  });

  it("knows the language of every starter collection", () => {
    const { collections } = JSON.parse(readFileSync("public/collections/index.json", "utf8"));
    for (const entry of collections) {
      const { word, translation } = languagePair(entry.language);
      assert.ok(LANGUAGES.includes(word) && LANGUAGES.includes(translation), entry.file);
    }
  });
});

