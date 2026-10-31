// Card order for both study modes.

const HOUR = 1000 * 60 * 60;

/**
 * How strongly a card should come early: never seen, or not seen for 100 hours or more, is the
 * maximum (100); seen within the last 10 hours is the minimum (10); in between, one per hour.
 */
export function weight(card, history, now = Date.now()) {
  const lastSeen = history[card.id] || 0;
  if (lastSeen === 0) return 100;
  return Math.max(10, Math.min(100, Math.floor((now - lastSeen) / HOUR)));
}

/**
 * Shuffles cards in place, leaning towards the ones not seen for a while (history: card id →
 * when it was last seen, in ms).
 *
 * Weighted random order (Efraimidis–Spirakis): each card gets the key random^(1/weight) and the
 * cards are sorted by it, so heavier cards tend to come first while any order stays possible.
 * About a third of the cards ignore their weight and take an average one instead, so the order
 * never becomes predictable. One pass and a sort: fine for thousands of cards.
 */
export function weightedShuffle(cards, history = {}, random = Math.random) {
  if (!cards || cards.length <= 1) return cards;

  const now = Date.now();
  const keyed = cards.map((card) => {
    const w = random() < 0.3 ? 55 : weight(card, history, now);
    return { card, key: random() ** (1 / w) };
  });
  keyed.sort((a, b) => b.key - a.key);
  keyed.forEach((entry, i) => {
    cards[i] = entry.card;
  });
  return cards;
}

/** Fisher-Yates: a uniformly random order, in place. */
export function shuffle(array, random = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
