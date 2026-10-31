// CSV import/export tests, and a check that every shipped starter collection imports cleanly.
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const context = { globalThis: {} };
vm.runInNewContext(readFileSync("public/src/utils/csv.js", "utf8"), context);
const { parse, toCards, fromCards, fileName } = context.globalThis.CsvUtils;

describe("parse", () => {
  it("handles quotes, embedded commas, doubled quotes, CRLF and a BOM", () => {
    const text = '﻿word,translation\r\n"hola, amigo","hi, friend"\r\n"él dijo ""sí""",he said yes\r\n';
    assert.deepEqual(JSON.parse(JSON.stringify(parse(text))), [
      ["word", "translation"],
      ["hola, amigo", "hi, friend"],
      ['él dijo "sí"', "he said yes"],
    ]);
  });

  it("keeps newlines inside quoted fields and skips blank lines", () => {
    const rows = parse('a,"line one\nline two"\n\n\nb,c');
    assert.equal(rows.length, 2);
    assert.equal(rows[0][1], "line one\nline two");
  });
});

describe("toCards", () => {
  it("reads the word and translation columns by header, in any order", () => {
    const cards = toCards("translation,word,notes\nhouse,la casa,x\n");
    assert.deepEqual(JSON.parse(JSON.stringify(cards)), [{ word: "la casa", translation: "house" }]);
  });

  it("falls back to the first two columns without a header", () => {
    const cards = toCards("perro,собака\ngato\n");
    assert.deepEqual(JSON.parse(JSON.stringify(cards)), [
      { word: "perro", translation: "собака" },
      { word: "gato", translation: "" },
    ]);
  });

  it("skips empty and repeated words", () => {
    const cards = toCards("word,translation\n,nothing\nhola,hi\nHola,hello\n");
    assert.equal(cards.length, 1);
    assert.equal(cards[0].translation, "hi");
  });
});

describe("fromCards", () => {
  it("round-trips through toCards", () => {
    const cards = [
      { word: "hola, amigo", translation: 'hi "friend"' },
      { word: "casa", translation: "" },
    ];
    assert.deepEqual(JSON.parse(JSON.stringify(toCards(fromCards(cards)))), cards);
  });

  it("makes a safe file name", () => {
    assert.equal(fileName('A1: nouns/verbs?'), "A1 nouns verbs.csv");
    assert.equal(fileName(""), "collection.csv");
  });
});

describe("starter collections", () => {
  const dir = "public/collections";
  const index = JSON.parse(readFileSync(`${dir}/index.json`, "utf8"));

  it("lists every CSV in the folder, with the right word counts", () => {
    const files = readdirSync(`${dir}/es-en`).filter((f) => f.endsWith(".csv")).map((f) => `es-en/${f}`);
    assert.deepEqual(index.collections.map((c) => c.file).sort(), files.sort());
    for (const entry of index.collections) {
      const cards = toCards(readFileSync(`${dir}/${entry.file}`, "utf8"));
      assert.equal(cards.length, entry.words, entry.file);
      assert.ok(cards.every((c) => c.word && c.translation), `${entry.file} has an empty field`);
    }
  });

  it("never repeats a Spanish word across collections", () => {
    const seen = new Map();
    for (const entry of index.collections) {
      for (const { word } of toCards(readFileSync(`${dir}/${entry.file}`, "utf8"))) {
        const key = word.toLowerCase();
        assert.ok(!seen.has(key), `"${word}" is in ${seen.get(key)} and ${entry.file}`);
        seen.set(key, entry.file);
      }
    }
  });
});
