// CSV import/export tests, and a check that every shipped starter collection imports cleanly.
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_ROWS, fileName, fromCards, parse, readCards, toCards } from "../public/src/utils/csv.js";

describe("parse", () => {
  it("handles quotes, embedded commas, doubled quotes, CRLF and a BOM", () => {
    const text = '﻿word,translation\r\n"hola, amigo","hi, friend"\r\n"él dijo ""sí""",he said yes\r\n';
    assert.deepEqual(parse(text), [
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
    assert.deepEqual(cards, [{ word: "la casa", translation: "house" }]);
  });

  it("falls back to the first two columns without a header", () => {
    const cards = toCards("perro,собака\ngato\n");
    assert.deepEqual(cards, [
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

describe("readCards", () => {
  it("counts the rows it skips: no word, or a word already seen", () => {
    const { cards, skipped, truncated } = readCards("word,translation\nhola,hi\n,orphan\nHola,again\nadiós,bye\n");
    assert.deepEqual(cards.map((c) => c.word), ["hola", "adiós"]);
    assert.equal(skipped, 2);
    assert.equal(truncated, 0);
  });

  it("counts words and translations too long to keep whole", () => {
    const text = `word,translation\n${"a".repeat(201)},x\nb,${"y".repeat(501)}\nc,z\n`;
    assert.equal(readCards(text).shortened, 2);
  });

  it("stops at MAX_ROWS words and counts the rest", () => {
    const rows = Array.from({ length: MAX_ROWS + 3 }, (_, i) => `word${i},t${i}`);
    const { cards, truncated } = readCards(rows.join("\n"));
    assert.equal(cards.length, MAX_ROWS);
    assert.equal(truncated, 3);
  });
});

describe("fromCards", () => {
  it("round-trips through toCards", () => {
    const cards = [
      { word: "hola, amigo", translation: 'hi "friend"' },
      { word: "casa", translation: "" },
    ];
    assert.deepEqual(toCards(fromCards(cards)), cards);
  });

  it("makes a safe file name", () => {
    assert.equal(fileName('A1: nouns/verbs?'), "A1 nouns verbs.csv");
    assert.equal(fileName(""), "collection.csv");
  });
});

describe("languages in the header", () => {
  it("reads language codes as the column names, in any case", () => {
    const { cards, language } = readCards("ES,en\nhola,hi\n");
    assert.deepEqual(cards, [{ word: "hola", translation: "hi" }]);
    assert.equal(language, "es-en");
  });

  it("takes a code for one side only", () => {
    assert.equal(readCards("es,translation\nhola,hi\n").language, "es-");
    assert.equal(readCards("word,en\nhola,hi\n").language, "-en");
  });

  it("has no language with plain column names or no header", () => {
    assert.equal(readCards("word,translation\nhola,hi\n").language, "");
    assert.equal(readCards("hola,hi\n").language, "");
  });

  it("treats a first row that doesn't name both columns as a word", () => {
    const { cards, language } = readCards("es,yes\nhola,hi\n");
    assert.equal(cards.length, 2);
    assert.equal(language, "");
  });

  it("writes the languages on export and reads them back", () => {
    const cards = [{ word: "hola", translation: "hi" }];
    assert.ok(fromCards(cards, "es-en").includes("es,en\n"));
    assert.ok(fromCards(cards, "es-").includes("es,translation\n"));
    assert.ok(fromCards(cards).includes("word,translation\n"));
    for (const language of ["es-en", "es-", "-en", ""]) {
      const result = readCards(fromCards(cards, language));
      assert.deepEqual(result.cards, cards);
      assert.equal(result.language, language);
    }
  });
});

describe("example.csv", () => {
  it("is a valid collection that shows the format, including a quoted comma", () => {
    const cards = toCards(readFileSync("public/collections/example.csv", "utf8"));
    assert.ok(cards.length >= 5);
    assert.ok(cards.every((c) => c.word && c.translation));
    assert.ok(cards.some((c) => c.translation.includes(",")));
  });

  it("shows the header with language codes", () => {
    assert.equal(readCards(readFileSync("public/collections/example.csv", "utf8")).language, "es-en");
  });
});

describe("starter collections", () => {
  const dir = "public/collections";
  const index = JSON.parse(readFileSync(`${dir}/index.json`, "utf8"));

  it("lists every CSV in the folder, with the right word counts", () => {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => readdirSync(`${dir}/${d.name}`).filter((f) => f.endsWith(".csv")).map((f) => `${d.name}/${f}`));
    assert.deepEqual(index.collections.map((c) => c.file).sort(), files.sort());
    for (const entry of index.collections) {
      const { cards, language } = readCards(readFileSync(`${dir}/${entry.file}`, "utf8"));
      assert.equal(cards.length, entry.words, entry.file);
      assert.equal(language, entry.language, `${entry.file} has a different language in its header`);
      assert.ok(cards.every((c) => c.word && c.translation), `${entry.file} has an empty field`);
      assert.ok(entry.name && entry.language && entry.level, `${entry.file} is missing name, language or level`);
      assert.equal(entry.file.split("/")[0], entry.language, `${entry.file} is not in its language folder`);
    }
  });

  // The A1/A2 series is designed to have no overlap; other collections (topics, contributions)
  // may share words with it and with each other.
  it("never repeats a Spanish word across the A1/A2 core series", () => {
    const seen = new Map();
    for (const entry of index.collections.filter((c) => /^es-en\/a[12]-/.test(c.file))) {
      for (const { word } of toCards(readFileSync(`${dir}/${entry.file}`, "utf8"))) {
        const key = word.toLowerCase();
        assert.ok(!seen.has(key), `"${word}" is in ${seen.get(key)} and ${entry.file}`);
        seen.set(key, entry.file);
      }
    }
  });
});
