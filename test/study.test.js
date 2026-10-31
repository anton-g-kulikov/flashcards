// Study logic: progress bookkeeping and the quiz's choices.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Progress } from "../public/src/features/study/progress.js";
import {
  MAX_OPTIONS,
  nextStep,
  pickOptions,
  pickQuestion,
  quizPool,
  recordAnswer,
} from "../public/src/features/study/quiz-logic.js";

const card = (id, translation = `t-${id}`) => ({ id, word: `w-${id}`, translation });

describe("Progress", () => {
  it("marks cards known and unknown, and remembers when each was seen", () => {
    const progress = new Progress();
    progress.markKnown("a", 100);
    progress.markUnknown("b", 200);
    assert.ok(progress.isKnown("a"));
    assert.ok(!progress.isKnown("b"));
    assert.deepEqual(progress.history, { a: 100, b: 200 });

    progress.markUnknown("a", 300);
    assert.ok(!progress.isKnown("a"));
    assert.equal(progress.history.a, 300);
  });

  it("lists unknown cards in order and counts known ones", () => {
    const progress = new Progress({ known: ["b"] });
    const cards = [card("a"), card("b"), card("c")];
    assert.deepEqual(progress.unknown(cards).map((c) => c.id), ["a", "c"]);
    assert.equal(progress.knownCount(cards), 1);
  });

  it("resets only the given cards", () => {
    const progress = new Progress({ known: ["a", "b"], history: { a: 1, b: 2 } });
    progress.reset(["a"]);
    assert.deepEqual([...progress.known], ["b"]);
    assert.deepEqual(progress.history, { b: 2 });
  });

  it("records each change for saving, the latest one per card", () => {
    const progress = new Progress({ known: ["b"], history: { b: 1 } });
    progress.markKnown("a", 10);
    progress.markUnknown("b", 20);
    progress.markKnown("c", 30);
    progress.markUnknown("c", 40);
    progress.seen("d", 50);
    assert.ok(progress.hasChanges());
    assert.deepEqual(progress.takeChanges(), {
      knownAdd: ["a"],
      knownRemove: ["b", "c"],
      history: { a: 10, b: 20, c: 40, d: 50 },
    });
    assert.ok(!progress.hasChanges());
    assert.deepEqual(progress.takeChanges(), { knownAdd: [], knownRemove: [], history: {} });
  });

  it("records a reset as forgetting, only for what was there", () => {
    const progress = new Progress({ known: ["a"], history: { a: 1, b: 2 } });
    progress.reset(["a", "b", "c"]);
    assert.deepEqual(progress.takeChanges(), { knownAdd: [], knownRemove: ["a"], history: { a: null, b: null } });
  });

  it("prunes cards that no longer exist", () => {
    const progress = new Progress({ known: ["a", "gone"], history: { a: 1, gone: 2, old: 3 } });
    assert.ok(progress.prune(new Set(["a"])));
    assert.deepEqual([...progress.known], ["a"]);
    assert.deepEqual(progress.history, { a: 1 });
    assert.deepEqual(progress.takeChanges(), {
      knownAdd: [],
      knownRemove: ["gone"],
      history: { gone: null, old: null },
    });
    assert.ok(!progress.prune(new Set(["a"])));
  });

  it("puts unsaved changes back, unless newer ones replaced them", () => {
    const progress = new Progress();
    progress.markKnown("a", 1);
    progress.seen("b", 2);
    const failed = progress.takeChanges();
    progress.markUnknown("a", 3);
    progress.restoreChanges(failed);
    assert.deepEqual(progress.takeChanges(), { knownAdd: [], knownRemove: ["a"], history: { a: 3, b: 2 } });
  });

  it("doesn't share state with what it was loaded from", () => {
    const saved = { known: ["a"], history: { a: 1 } };
    const progress = new Progress(saved);
    progress.markKnown("b", 2);
    assert.deepEqual(saved, { known: ["a"], history: { a: 1 } });
  });
});

describe("quizPool", () => {
  it("holds unknown cards that have a translation", () => {
    const progress = new Progress({ known: ["a"] });
    const pool = quizPool([card("a"), card("b"), card("c", ""), card("d", "  ")], progress);
    assert.deepEqual(pool.map((c) => c.id), ["b"]);
  });
});

describe("pickQuestion", () => {
  const pool = Array.from({ length: 10 }, (_, i) => card(`c${i}`));

  it("draws from the first 80% of a larger pool", () => {
    assert.equal(pickQuestion(pool, () => 0).id, "c0");
    assert.equal(pickQuestion(pool, () => 0.999).id, "c7");
  });

  it("draws from the whole of a small pool", () => {
    assert.equal(pickQuestion(pool.slice(0, 5), () => 0.999).id, "c4");
  });
});

describe("pickOptions", () => {
  it("offers the right card and up to three others, each once", () => {
    const pool = Array.from({ length: 10 }, (_, i) => card(`c${i}`));
    const options = pickOptions(pool[3], pool);
    assert.equal(options.length, MAX_OPTIONS);
    assert.ok(options.includes(pool[3]));
    assert.equal(new Set(options.map((o) => o.id)).size, MAX_OPTIONS);
  });

  it("never offers two options that read the same", () => {
    const pool = [card("a", "house"), card("b", "House "), card("c", "house"), card("d", "dog")];
    const options = pickOptions(pool[0], pool);
    assert.deepEqual(options.map((o) => o.id).sort(), ["a", "d"]);
  });

  it("offers fewer options when the pool is small", () => {
    const pool = [card("a"), card("b")];
    assert.equal(pickOptions(pool[0], pool).length, 2);
  });

  it("puts the right card in any position", () => {
    const pool = Array.from({ length: 4 }, (_, i) => card(`c${i}`));
    const positions = new Set();
    for (let run = 0; run < 200; run++) positions.add(pickOptions(pool[0], pool).indexOf(pool[0]));
    assert.equal(positions.size, 4);
  });
});

describe("recordAnswer", () => {
  it("first try: the word is known and leaves the pool", () => {
    const progress = new Progress();
    const pool = [card("a"), card("b")];
    const next = recordAnswer(progress, pool, "a", true, 5);
    assert.ok(progress.isKnown("a"));
    assert.deepEqual(next.map((c) => c.id), ["b"]);
  });

  it("after a wrong answer: the word stays unknown and in the pool", () => {
    const progress = new Progress();
    const pool = [card("a"), card("b")];
    const next = recordAnswer(progress, pool, "a", false, 5);
    assert.ok(!progress.isKnown("a"));
    assert.equal(progress.history.a, 5);
    assert.equal(next, pool);
  });
});

describe("nextStep", () => {
  it("asks while two or more words are left, then the last word, then done", () => {
    assert.equal(nextStep([card("a"), card("b")]), "ask");
    assert.equal(nextStep([card("a")]), "last");
    assert.equal(nextStep([]), "done");
  });
});
