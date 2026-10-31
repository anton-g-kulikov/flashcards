// Random order: a real permutation, in place.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shuffle } from "../public/src/utils/shuffle-utils.js";

describe("shuffle", () => {
  it("returns the same items, each once, in place", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = shuffle(items);
    assert.equal(result, items);
    assert.deepEqual([...result].sort(), [1, 2, 3, 4, 5, 6]);
  });

  it("can put any item first", () => {
    const firsts = new Set();
    for (let run = 0; run < 200; run++) firsts.add(shuffle([1, 2, 3, 4])[0]);
    assert.equal(firsts.size, 4);
  });

  it("orders 5,000 items quickly", () => {
    const started = performance.now();
    shuffle(Array.from({ length: 5000 }, (_, i) => i));
    assert.ok(performance.now() - started < 50);
  });
});
