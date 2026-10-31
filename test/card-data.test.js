// The stored card shape.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cardFields, storedCards } from "../public/src/core/card-data.js";

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
