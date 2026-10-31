// The quiz's choices, kept apart from the page so the tests can import them: which word to ask
// about and which translations to offer.
import { shuffle } from "../../utils/shuffle-utils.js";

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

// The next word to ask about: the first in the queue, but not the one just asked, while there
// is another
export function pickQuestion(pool, lastId) {
  return pool.length > 1 && pool[0].id === lastId ? pool[1] : pool[0];
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
