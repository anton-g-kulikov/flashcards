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
  studyCard,
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

describe("studyCard", () => {
  const card = { id: "c1", word: "la casa", translation: "house", collectionId: "k1", extra: 1 };

  it("shows the word first by default, with its languages", () => {
    assert.deepEqual(studyCard(card, { language: "es-en" }), {
      id: "c1",
      word: "la casa",
      translation: "house",
      languages: { word: "es", translation: "en" },
    });
  });

  it("swaps the sides and their languages in a reversed collection", () => {
    assert.deepEqual(studyCard(card, { language: "es-en", reversed: true }), {
      id: "c1",
      word: "house",
      translation: "la casa",
      languages: { word: "en", translation: "es" },
      reversed: true,
    });
  });

  it("keeps the same id, so progress is shared by both directions", () => {
    assert.equal(studyCard(card, { reversed: true }).id, studyCard(card, {}).id);
  });

  it("leaves a word without a translation the right way round", () => {
    const bare = studyCard({ id: "c2", word: "hola", translation: "" }, { language: "es-en", reversed: true });
    assert.equal(bare.word, "hola");
    assert.deepEqual(bare.languages, { word: "es", translation: "en" });
  });

  it("works without a collection", () => {
    assert.deepEqual(studyCard(card).languages, { word: "", translation: "" });
  });
});

