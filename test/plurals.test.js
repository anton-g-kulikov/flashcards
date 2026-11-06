// {count|word|words} in a translation picks the form that goes with the number. i18n.js translates
// the page as it loads, so it needs a page to load into.
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

globalThis.document = { documentElement: {}, querySelectorAll: () => [] };
const { I18n } = await import("../public/src/ui/i18n.js");

const say = (lang, key, vars) => {
  I18n.lang = lang;
  return I18n.t(key, vars);
};

describe("word counts", () => {
  const cases = {
    en: { 0: "0 words", 1: "1 word", 2: "2 words", 5: "5 words", 21: "21 words", 1000000: "1000000 words" },
    es: { 0: "0 palabras", 1: "1 palabra", 2: "2 palabras", 5: "5 palabras", 21: "21 palabras", 1000000: "1000000 palabras" },
  };
  for (const [lang, counts] of Object.entries(cases)) {
    for (const [count, text] of Object.entries(counts)) {
      it(`reads "${text}"`, () => {
        assert.equal(say(lang, "collections.wordCount", { count: Number(count) }), text);
      });
    }
  }

  it("reads right in Russian, which names the noun first", () => {
    assert.equal(say("ru", "collections.wordCount", { count: 1 }), "Слов: 1");
  });

  it("covers the footer and the import messages", () => {
    assert.equal(say("en", "footer.words", { count: 1 }), "Vocabulary: 1 word");
    assert.equal(say("es", "footer.words", { count: 1 }), "Vocabulario: 1 palabra");
    assert.equal(say("en", "collections.imported", { name: "A", count: 1 }), "Imported “A”: 1 word.");
    assert.equal(say("es", "collections.imported", { name: "A", count: 1 }), "Importada «A»: 1 palabra.");
    assert.equal(say("en", "collections.importing", { name: "A", count: 1 }), "Importing “A” (1 word)…");
    assert.equal(say("es", "collections.importing", { name: "A", count: 2 }), "Importando «A» (2 palabras)…");
  });
});

describe("verbs", () => {
  it("agree with the count in English", () => {
    assert.equal(say("en", "collections.importSkipped", { count: 1 }), "Skipped 1 row with no word or a repeated word.");
    assert.equal(say("en", "collections.importSkipped", { count: 2 }), "Skipped 2 rows with no word or a repeated word.");
    assert.match(say("en", "collections.importTruncated", { max: 5000, count: 1 }), /; 1 more was left out\.$/);
    assert.match(say("en", "collections.importTruncated", { max: 5000, count: 2 }), /; 2 more were left out\.$/);
    assert.match(say("en", "collections.importShortened", { count: 1 }), /^1 word or translation was too long/);
    assert.match(say("en", "collections.importShortened", { count: 2 }), /^2 words or translations were too long/);
  });

  it("agree with the count in Spanish", () => {
    assert.equal(say("es", "collections.importSkipped", { count: 1 }), "Se omitió 1 fila sin palabra o con una palabra repetida.");
    assert.equal(say("es", "collections.importSkipped", { count: 2 }), "Se omitieron 2 filas sin palabra o con una palabra repetida.");
    assert.match(say("es", "collections.importTruncated", { max: 5000, count: 1 }), /quedó fuera 1 más\.$/);
    assert.match(say("es", "collections.importTruncated", { max: 5000, count: 2 }), /quedaron fuera 2 más\.$/);
    assert.match(say("es", "collections.importShortened", { count: 1 }), /^Se recortó 1 palabra o traducción demasiado larga/);
    assert.match(say("es", "collections.importShortened", { count: 2 }), /^Se recortaron 2 palabras o traducciones demasiado largas/);
  });

  it("agree with the count in Russian", () => {
    const left = (count) => say("ru", "collections.importTruncated", { max: 5000, count }).split("; ")[1];
    assert.equal(left(1), "ещё 1 не вошло.");
    assert.equal(left(2), "ещё 2 не вошли.");
    assert.equal(left(5), "ещё 5 не вошли.");
    assert.equal(left(21), "ещё 21 не вошло.");
    assert.equal(left(22), "ещё 22 не вошли.");
  });
});

describe("I18n.pluralForm", () => {
  it("knows Russian's three forms", () => {
    I18n.lang = "ru";
    const forms = ["слово", "слова", "слов"];
    const picks = [1, 2, 5, 11, 21, 22].map((count) => I18n.pluralForm(count, forms));
    assert.deepEqual(picks, ["слово", "слова", "слов", "слов", "слово", "слова"]);
  });
});

describe("the translation table", () => {
  const source = readFileSync("public/src/ui/i18n.js", "utf8");
  const block = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));
  const plurals = (text) => [...text.matchAll(/\{(\w+)\|([^}]+)\}/g)].map(([, name, forms]) => [name, forms.split("|")]);

  it("gives each plural every form its language needs, for a number the callers pass", () => {
    const languages = {
      en: [block("  en: {", "  ru: {"), 2],
      ru: [block("  ru: {", "  es: {"), 3],
      es: [block("  es: {", "const LANGUAGES"), 2],
    };
    for (const [lang, [text, size]] of Object.entries(languages)) {
      const found = plurals(text);
      assert.ok(found.length > 0, lang);
      for (const [name, forms] of found) {
        assert.equal(name, "count", lang);
        assert.equal(forms.length, size, `${lang}: ${forms.join("|")}`);
      }
    }
  });
});

describe("I18n.t", () => {
  it("still fills in plain variables, and leaves a missing one as written", () => {
    assert.equal(say("en", "quiz.needTwo.count", { count: 1 }), "You have 1 right now.");
    assert.equal(say("en", "collections.wordCount", {}), "{count} {count|word|words}");
  });
});
