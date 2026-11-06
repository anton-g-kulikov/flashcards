// Study logic: spaced repetition (Leitner boxes) and the quiz's choices.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DAY,
  INTERVAL_DAYS,
  MASTERED,
  Progress,
  RETRY_GAP,
  retryLater,
} from "../public/src/features/study/progress.js";
import { studyDirection } from "../public/src/features/study/direction.js";
import { initialMode } from "../public/src/features/study/mode.js";
import { dragAxis, swipeDirection } from "../public/src/features/study/swipe.js";
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

describe("the mode the page opens in", () => {
  it("is quiz until one has been chosen", () => {
    assert.equal(initialMode(null, null), "quiz");
  });

  it("is the mode last chosen on this device", () => {
    assert.equal(initialMode(null, "flashcard"), "flashcard");
    assert.equal(initialMode(null, "quiz"), "quiz");
  });

  it("gives way to a home-screen shortcut", () => {
    assert.equal(initialMode("quiz", "flashcard"), "quiz");
    assert.equal(initialMode("flashcard", "quiz"), "flashcard");
  });

  it("ignores anything it doesn't know", () => {
    assert.equal(initialMode("bogus", "flashcard"), "flashcard");
    assert.equal(initialMode("bogus", "old"), "quiz");
  });
});

describe("swiping a flashcard", () => {
  it("reads a drag as sideways or up and down once it has moved far enough", () => {
    assert.equal(dragAxis(4, 3), null);
    assert.equal(dragAxis(12, 3), "horizontal");
    assert.equal(dragAxis(-12, 3), "horizontal");
    assert.equal(dragAxis(3, 12), "vertical");
    assert.equal(dragAxis(12, -14), "vertical");
  });

  it("counts a swipe past 30% of the card's width, or 100 px on a wide card", () => {
    assert.equal(swipeDirection(110, 340), "right");
    assert.equal(swipeDirection(-110, 340), "left");
    assert.equal(swipeDirection(95, 340), null, "short of 102 px, but the cap is 100");
    assert.equal(swipeDirection(101, 560), "right", "the cap, on a wide card");
    assert.equal(swipeDirection(-99, 560), null);
    assert.equal(swipeDirection(0, 340), null);
  });
});

describe("flashcards", () => {
  it("put a missed card back behind the next ten cards, or last when fewer are left", () => {
    const ids = (deck) => deck.map((c) => c.id);
    assert.equal(RETRY_GAP, 10);
    const deck = Array.from({ length: 15 }, (_, index) => card(`w${index}`));
    assert.equal(ids(retryLater(deck, card("m"))).indexOf("m"), 10);
    assert.deepEqual(ids(retryLater([card("b"), card("c")], card("m"))), ["b", "c", "m"]);
    assert.deepEqual(ids(retryLater([card("b")], card("m"))), ["b", "m"]);
    assert.deepEqual(ids(retryLater([], card("m"))), ["m"]);
  });
});

describe("quiz", () => {
  it("asks about queued words that have a translation", () => {
    const progress = new Progress({ srs: { later: { box: 2, due: NOW + DAY } } });
    const pool = quizPool([card("a"), card("b", ""), card("later")], progress, NOW);
    assert.deepEqual(pool.map((c) => c.id), ["a"]);
  });

  it("asks the first word in the queue not asked in the last ten questions", () => {
    const others = Array.from({ length: RETRY_GAP }, (_, index) => `w${index}`);
    const pool = ["a", ...others, "z"].map((id) => card(id));
    assert.equal(pickQuestion(pool).id, "a");
    assert.equal(pickQuestion(pool, ["a"]).id, "w0");
    assert.equal(pickQuestion(pool, [...others.slice(0, RETRY_GAP - 1).reverse(), "a"]).id, "w9");
    assert.equal(pickQuestion(pool, [...[...others].reverse(), "a"]).id, "a", "a waited ten questions");
  });

  it("brings a missed word back after ten other questions, ahead of the words behind them", () => {
    // "m" was missed: it stays due at the front of the queue, the others are answered and leave
    const others = Array.from({ length: RETRY_GAP + 3 }, (_, index) => `w${index}`);
    let pool = ["m", ...others].map((id) => card(id));
    let recent = [];
    const asked = [];
    for (let turn = 0; turn < RETRY_GAP + 2; turn++) {
      const next = pickQuestion(pool, recent);
      asked.push(next.id);
      recent = [next.id, ...recent.filter((id) => id !== next.id)].slice(0, RETRY_GAP);
      if (next.id !== "m" || turn > 0) pool = pool.filter((c) => c.id !== next.id);
    }
    assert.deepEqual(asked, ["m", ...others.slice(0, RETRY_GAP), "m"]);
  });

  it("brings a missed word back after all the others when fewer than ten are left", () => {
    let pool = ["m", "b", "c"].map((id) => card(id));
    let recent = [];
    const asked = [];
    for (let turn = 0; turn < 4; turn++) {
      const next = pickQuestion(pool, recent);
      asked.push(next.id);
      recent = [next.id, ...recent.filter((id) => id !== next.id)].slice(0, RETRY_GAP);
      if (next.id !== "m" || turn > 0) pool = pool.filter((c) => c.id !== next.id);
    }
    assert.deepEqual(asked, ["m", "b", "c", "m"]);
  });

  it("asks the word asked longest ago when every word left was asked recently", () => {
    const pool = [card("a"), card("b")];
    assert.equal(pickQuestion(pool, ["a", "b"]).id, "b");
    assert.equal(pickQuestion([card("a")], ["a"]).id, "a");
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

  it("offers cards facing the same way, so the right answer doesn't stand out", () => {
    const reversed = (id) => ({ ...card(id, `es-${id}`), reversed: true });
    const cards = [reversed("a"), reversed("b"), reversed("c"), reversed("d"), card("e", "en-e"), card("f", "en-f")];
    for (let run = 0; run < 50; run++) {
      assert.ok(pickOptions(cards[0], cards).every((option) => option.reversed));
      assert.ok(pickOptions(cards[4], [...cards, card("g", "en-g"), card("h", "en-h")]).every((o) => !o.reversed));
    }
  });

  it("fills up with cards facing the other way when too few face the same way", () => {
    const cards = [{ ...card("a", "es-a"), reversed: true }, card("b", "en-b"), card("c", "en-c"), card("d", "en-d")];
    assert.equal(pickOptions(cards[0], cards).length, 4);
  });

  it("counts different translations", () => {
    assert.equal(distinctTranslations([card("a", "x"), card("b", " X"), card("c", ""), card("d", "y")]), 2);
  });
});

describe("studyDirection", () => {
  const es = (reversed = false) => ({ language: "es-en", reversed });

  it("names the languages in the order the cards show them", () => {
    const forward = studyDirection([es(), es()]);
    assert.deepEqual([forward.first.language, forward.second.language, forward.reversed], ["es", "en", false]);
    const back = studyDirection([es(true), es(true)]);
    assert.deepEqual([back.first.language, back.second.language, back.reversed], ["en", "es", true]);
    assert.equal(back.first.side, "translation");
  });

  it("calls a mix of directions mixed, not reversed", () => {
    const { mixed, reversed, first } = studyDirection([es(true), es()]);
    assert.deepEqual([mixed, reversed, first.side], [true, false, "word"]);
  });

  it("names no languages when the collections don't share a pair", () => {
    const { first, second } = studyDirection([es(), { language: "fr-en" }]);
    assert.deepEqual([first.language, second.language], ["", ""]);
  });

  it("copes with no languages and no collections", () => {
    assert.equal(studyDirection([{}]).first.language, "");
    assert.deepEqual([studyDirection([]).reversed, studyDirection([]).mixed], [false, false]);
  });
});

