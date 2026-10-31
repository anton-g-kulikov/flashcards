// The quiz's choices, kept apart from the page so the tests can import them: which word to ask
// about, which translations to offer, and what an answer does to progress and the pool.
import { shuffle } from "../../utils/shuffle-utils.js";

export const MAX_OPTIONS = 4;

const normalize = (text) => String(text || "").trim().toLowerCase();

// The words a quiz can use: unknown ones that have a translation
export function quizPool(cards, progress) {
  return progress.unknown(cards).filter((card) => normalize(card.translation));
}

// The word to ask about. The pool comes in weighted order (words not seen for a while first), so
// the question is drawn from its first 80%; small pools are drawn from whole.
export function pickQuestion(pool, random = Math.random) {
  const reach = pool.length <= 5 ? pool.length : Math.floor(pool.length * 0.8);
  return pool[Math.floor(random() * reach)];
}

// The right card plus up to MAX_OPTIONS - 1 others from the pool, in random order. Every option
// reads differently: a translation that matches one already offered would be a second right
// answer, so it is left out.
export function pickOptions(correct, pool, random = Math.random) {
  const options = [correct];
  const offered = new Set([normalize(correct.translation)]);
  for (const card of shuffle([...pool], random)) {
    if (options.length >= MAX_OPTIONS) break;
    const text = normalize(card.translation);
    if (card.id === correct.id || offered.has(text)) continue;
    offered.add(text);
    options.push(card);
  }
  return shuffle(options, random);
}

// A right answer: on the first try the word is known and leaves the pool; after a wrong answer it
// stays unknown and comes back later. Returns the pool for the next question.
export function recordAnswer(progress, pool, correctId, firstTry, now = Date.now()) {
  if (!firstTry) {
    progress.seen(correctId, now);
    return pool;
  }
  progress.markKnown(correctId, now);
  return pool.filter((card) => card.id !== correctId);
}

// What comes after an answer: another question, the last word (studied as a flashcard), or done
export function nextStep(pool) {
  if (pool.length === 0) return "done";
  if (pool.length === 1) return "last";
  return "ask";
}
