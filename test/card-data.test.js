// Stored card shape, and moving cards out of the old one-document-per-card layout.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COLLECTION,
  MAX_CARDS,
  cardFields,
  planMigration,
  storedCards,
} from "../public/src/core/card-data.js";

const legacy = (id, collectionId, word = `w-${id}`) => ({ id, word, translation: "", collectionId });
let counter = 0;
const newId = () => `new${++counter}`;

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

describe("planMigration", () => {
  const collections = [{ id: "k1", name: "Verbs", cards: [{ id: "c1", word: "ir", translation: "" }] }];

  it("moves cards into the collection they name, after the cards already there", () => {
    const writes = planMigration(collections, [legacy("c2", "k1")], "Mine", newId);
    assert.deepEqual(writes, [
      {
        id: "k1",
        name: "Verbs",
        isNew: false,
        cards: [
          { id: "c1", word: "ir", translation: "" },
          { id: "c2", word: "w-c2", translation: "" },
        ],
      },
    ]);
  });

  it("sends cards without a collection, or whose collection is gone, to a new default one", () => {
    const writes = planMigration(collections, [legacy("c2"), legacy("c3", "gone")], "Mine", newId);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].id, DEFAULT_COLLECTION);
    assert.equal(writes[0].name, "Mine");
    assert.ok(writes[0].isNew);
    assert.deepEqual(writes[0].cards.map((c) => c.id), ["c2", "c3"]);
  });

  it("skips cards already moved, so an interrupted move can run again", () => {
    const writes = planMigration(collections, [legacy("c1", "k1"), legacy("c2", "k1")], "Mine", newId);
    assert.deepEqual(writes[0].cards.map((c) => c.id), ["c1", "c2"]);
  });

  it("overflows past MAX_CARDS into numbered new collections", () => {
    const many = Array.from({ length: MAX_CARDS + 2 }, (_, i) => legacy(`x${i}`, "k1"));
    const writes = planMigration(collections, many, "Mine", newId);
    assert.equal(writes.length, 2);
    assert.equal(writes[0].cards.length, MAX_CARDS);
    assert.deepEqual(
      { name: writes[1].name, isNew: writes[1].isNew, count: writes[1].cards.length },
      { name: "Verbs (2)", isNew: true, count: 3 }
    );
  });
});
