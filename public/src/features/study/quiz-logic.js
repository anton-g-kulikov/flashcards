// The quiz's choices, kept apart from the page so the tests can import them: which word to ask
// about and which translations to offer.
import { shuffle } from "../../utils/shuffle-utils.js";
import { RETRY_GAP } from "./progress.js";

export const MAX_OPTIONS = 4;

const normalize = (text) => String(text || "").trim().toLowerCase();

export const hasTranslation = (card) => normalize(card.translation) !== "";

// How many different translations there are to choose from
export function distinctTranslations(cards) {
  return new Set(cards.filter(hasTranslation).map((card) => normalize(card.translation))).size;
}

// The words the quiz can ask about now: the study queue's words that have a translation
export function quizPool(cards, progress, now = Date.now()) {
  return progress.studyQueue(cards, now).filter(hasTranslation);
}

// The next word to ask about: the first in the queue not asked in the last RETRY_GAP questions
// (`recent`, most recent first). Known words leave the queue, so in practice this holds back a
// word just missed. When every word left was asked that recently, the one asked longest ago.
export function pickQuestion(pool, recent = []) {
  const waiting = recent.slice(0, RETRY_GAP);
  const fresh = pool.find((card) => !waiting.includes(card.id));
  if (fresh) return fresh;
  return pool.reduce((oldest, card) => (waiting.indexOf(card.id) > waiting.indexOf(oldest.id) ? card : oldest));
}

// The right card plus up to MAX_OPTIONS - 1 others, from any word with a translation, in random
// order. Every option reads differently: a translation that matches one already offered would
// be a second right answer, so it is left out.
export function pickOptions(correct, cards, random = Math.random) {
  const options = [correct];
  const offered = new Set([normalize(correct.translation)]);
  for (const card of shuffle(cards.filter(hasTranslation), random)) {
    if (options.length >= MAX_OPTIONS) break;
    const text = normalize(card.translation);
    if (card.id === correct.id || offered.has(text)) continue;
    offered.add(text);
    options.push(card);
  }
  return shuffle(options, random);
}
