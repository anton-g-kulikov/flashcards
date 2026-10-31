// Study logic: spaced repetition (Leitner boxes) and the quiz's choices.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DAY, INTERVAL_DAYS, MASTERED, Progress } from "../public/src/features/study/progress.js";
import {
  MAX_OPTIONS,
  distinctTranslations,
  pickOptions,
  pickQuestion,
  quizPool,
} from "../public/src/features/study/quiz-logic.js";

const card = (id, translation = `t-${id}`) => ({ id, word: `w-${id}`, translation });
const NOW = 1_000 * DAY;

describe("boxes and due dates", () => {
  it("moves a known word up a box and schedules it by that box's interval", () => {
    const progress = new Progress();
    progress.right("a", NOW);
    assert.deepEqual(progress.srs.a, { box: 1, due: NOW + 1 * DAY });
    progress.right("a", NOW);
    assert.deepEqual(progress.srs.a, { box: 2, due: NOW + 3 * DAY });
    assert.deepEqual(INTERVAL_DAYS, [0, 1, 3, 7, 16, 35]);
  });

  it("keeps a mastered word in the top box, back every 35 days", () => {
    const progress = new Progress({ srs: { a: { box: MASTERED, due: NOW } } });
    progress.right("a", NOW);
    assert.deepEqual(progress.srs.a, { box: MASTERED, due: NOW + 35 * DAY });
  });

  it("drops a word not known to box 1, due straight away", () => {
    const progress = new Progress({ srs: { a: { box: 4, due: NOW } } });
    progress.wrong("a", NOW);
    assert.deepEqual(progress.srs.a, { box: 1, due: NOW });
    assert.ok(progress.needsStudy("a", NOW));
  });

  it("studies new and due words only", () => {
    const progress = new Progress({ srs: { due: { box: 2, due: NOW - 1 }, later: { box: 2, due: NOW + 1 } } });
    assert.ok(progress.needsStudy("new", NOW));
    assert.ok(progress.needsStudy("due", NOW));
    assert.ok(!progress.needsStudy("later", NOW));
  });
});

describe("studyQueue", () => {
  it("puts due words first, oldest day first, then new words; leaves out words not due", () => {
    const progress = new Progress({
      srs: {
        today: { box: 1, due: NOW },
        lastWeek: { box: 3, due: NOW - 7 * DAY },
        tomorrow: { box: 2, due: NOW + DAY },
      },
    });
    const queue = progress.studyQueue([card("new1"), card("today"), card("tomorrow"), card("lastWeek"), card("new2")], NOW);
    assert.deepEqual(queue.slice(0, 2).map((c) => c.id), ["lastWeek", "today"]);
    assert.deepEqual(queue.slice(2).map((c) => c.id).sort(), ["new1", "new2"]);
  });

  it("shuffles words due on the same day", () => {
    const srs = Object.fromEntries(["a", "b", "c"].map((id) => [id, { box: 1, due: NOW }]));
    const firsts = new Set();
    for (let run = 0; run < 100; run++) {
      firsts.add(new Progress({ srs }).studyQueue([card("a"), card("b"), card("c")], NOW)[0].id);
    }
    assert.equal(firsts.size, 3);
  });
});

describe("stats and next review", () => {
  it("counts due (and new), learning and mastered words, and the average box", () => {
    const progress = new Progress({
      srs: {
        due: { box: 1, due: NOW },
        learning: { box: 3, due: NOW + DAY },
        mastered: { box: 5, due: NOW + DAY },
      },
    });
    const cards = [card("new"), card("due"), card("learning"), card("mastered")];
    assert.deepEqual(progress.stats(cards, NOW), { due: 2, learning: 1, mastered: 1, level: 9 / 20 });
    assert.equal(progress.nextDue(cards), NOW);
    assert.equal(new Progress().nextDue(cards), null);
  });
});

describe("saved progress", () => {
  it("records each change for saving, the latest one per word", () => {
    const progress = new Progress();
    progress.right("a", NOW);
    progress.wrong("b", NOW);
    progress.right("b", NOW);
    assert.ok(progress.hasChanges());
    assert.deepEqual(progress.takeChanges(), {
      srs: { a: { box: 1, due: NOW + DAY }, b: { box: 2, due: NOW + 3 * DAY } },
    });
    assert.ok(!progress.hasChanges());
  });

  it("resets words to new, recording only words that had progress", () => {
    const progress = new Progress({ srs: { a: { box: 3, due: NOW } } });
    progress.reset(["a", "b"]);
    assert.equal(progress.box("a"), 0);
    assert.deepEqual(progress.takeChanges(), { srs: { a: null } });
  });

  it("prunes words that no longer exist", () => {
    const progress = new Progress({ srs: { a: { box: 1, due: NOW }, gone: { box: 2, due: NOW } } });
    assert.ok(progress.prune(new Set(["a"])));
    assert.deepEqual(Object.keys(progress.srs), ["a"]);
    assert.deepEqual(progress.takeChanges().srs, { gone: null });
    assert.ok(!progress.prune(new Set(["a"])));
  });

  it("puts unsaved changes back, unless newer ones replaced them", () => {
    const progress = new Progress();
    progress.right("a", NOW);
    progress.right("b", NOW);
    const failed = progress.takeChanges();
    progress.wrong("a", NOW);
    progress.restoreChanges(failed);
    assert.deepEqual(progress.takeChanges().srs, { a: { box: 1, due: NOW }, b: { box: 1, due: NOW + DAY } });
  });

  it("ignores malformed stored entries", () => {
    const progress = new Progress({ srs: { a: { box: 9, due: 1 }, b: { box: 2 }, c: "x", d: { box: 2, due: NOW } } });
    assert.deepEqual(Object.keys(progress.srs), ["d"]);
  });
});

describe("quiz", () => {
  it("asks about queued words that have a translation", () => {
    const progress = new Progress({ srs: { later: { box: 2, due: NOW + DAY } } });
    const pool = quizPool([card("a"), card("b", ""), card("later")], progress, NOW);
    assert.deepEqual(pool.map((c) => c.id), ["a"]);
  });

  it("asks the first word in the queue, but not the same word twice in a row", () => {
    const pool = [card("a"), card("b")];
    assert.equal(pickQuestion(pool, null).id, "a");
    assert.equal(pickQuestion(pool, "a").id, "b");
    assert.equal(pickQuestion([card("a")], "a").id, "a");
  });

  it("offers the right card and up to three others from any word, each reading differently", () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(`c${i}`));
    const options = pickOptions(cards[3], cards);
    assert.equal(options.length, MAX_OPTIONS);
    assert.ok(options.includes(cards[3]));
    const same = [card("a", "house"), card("b", "House "), card("c", ""), card("d", "dog")];
    assert.deepEqual(pickOptions(same[0], same).map((o) => o.id).sort(), ["a", "d"]);
  });

  it("puts the right card in any position", () => {
    const cards = Array.from({ length: 4 }, (_, i) => card(`c${i}`));
    const positions = new Set();
    for (let run = 0; run < 200; run++) positions.add(pickOptions(cards[0], cards).indexOf(cards[0]));
    assert.equal(positions.size, 4);
  });

  it("counts different translations", () => {
    assert.equal(distinctTranslations([card("a", "x"), card("b", " X"), card("c", ""), card("d", "y")]), 2);
  });
});
