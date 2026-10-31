// Card ordering: a real permutation, leaning towards cards not seen for a while, and fast.
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const context = { globalThis: {} };
vm.runInNewContext(readFileSync("public/src/utils/shuffle-utils.js", "utf8"), context);
const { ShuffleUtils } = context.globalThis;

const HOUR = 1000 * 60 * 60;
const cards = (n) => Array.from({ length: n }, (_, i) => ({ id: `c${i}` }));

describe("weight", () => {
  const now = 1_000 * HOUR;
  it("is highest for cards never seen or not seen for 100+ hours, lowest for recent ones", () => {
    assert.equal(ShuffleUtils.weight({ id: "a" }, {}, now), 100);
    assert.equal(ShuffleUtils.weight({ id: "a" }, { a: now - 200 * HOUR }, now), 100);
    assert.equal(ShuffleUtils.weight({ id: "a" }, { a: now - 40 * HOUR }, now), 40);
    assert.equal(ShuffleUtils.weight({ id: "a" }, { a: now - 1 * HOUR }, now), 10);
  });
});

describe("aggressiveShuffle", () => {
  it("returns the same cards, each once", () => {
    const deck = cards(50);
    const shuffled = ShuffleUtils.aggressiveShuffle([...deck], { cardInteractionHistory: {} });
    assert.deepEqual([...shuffled].map((c) => c.id).sort(), deck.map((c) => c.id).sort());
  });

  it("handles empty and single-card lists", () => {
    assert.deepEqual(ShuffleUtils.aggressiveShuffle([], null), []);
    assert.equal(ShuffleUtils.aggressiveShuffle([{ id: "x" }], null).length, 1);
  });

  it("puts cards not seen for a while earlier, on average, than ones just seen", () => {
    const deck = cards(40);
    const history = {};
    deck.slice(0, 20).forEach((c) => (history[c.id] = Date.now())); // first half: just seen
    let recentRank = 0;
    let staleRank = 0;
    for (let run = 0; run < 300; run++) {
      const order = ShuffleUtils.aggressiveShuffle([...deck], { cardInteractionHistory: history });
      order.forEach((c, i) => (history[c.id] ? (recentRank += i) : (staleRank += i)));
    }
    assert.ok(staleRank < recentRank * 0.8, `stale ${staleRank} vs recent ${recentRank}`);
  });

  it("orders 5,000 cards quickly", () => {
    const deck = cards(5000);
    const history = Object.fromEntries(deck.map((c, i) => [c.id, Date.now() - i * HOUR]));
    const started = performance.now();
    ShuffleUtils.aggressiveShuffle(deck, { cardInteractionHistory: history });
    assert.ok(performance.now() - started < 200, "took longer than 200 ms");
  });
});
