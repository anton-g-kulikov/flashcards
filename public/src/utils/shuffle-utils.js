// Shared shuffling utilities for both flashcard and quiz modes

const HOUR = 1000 * 60 * 60;

class ShuffleUtils {
  /**
   * How strongly a card should come early: never seen, or not seen for 100 hours or more, is the
   * maximum (100); seen within the last 10 hours is the minimum (10); in between, one per hour.
   */
  static weight(card, history, now = Date.now()) {
    const lastSeen = history[card.id] || 0;
    if (lastSeen === 0) return 100;
    return Math.max(10, Math.min(100, Math.floor((now - lastSeen) / HOUR)));
  }

  /**
   * Shuffles cards in place, leaning towards the ones not seen for a while.
   *
   * Weighted random order (Efraimidis–Spirakis): each card gets the key random^(1/weight) and the
   * cards are sorted by it, so heavier cards tend to come first while any order stays possible.
   * About a third of the cards ignore their weight and take an average one instead, so the order
   * never becomes predictable. One pass and a sort: fine for thousands of cards.
   */
  static aggressiveShuffle(array, vocabApp) {
    if (!array || array.length <= 1) return array;

    const history = (vocabApp && vocabApp.cardInteractionHistory) || {};
    const now = Date.now();
    const keyed = array.map((card) => {
      const weight = Math.random() < 0.3 ? 55 : ShuffleUtils.weight(card, history, now);
      return { card, key: Math.random() ** (1 / weight) };
    });
    keyed.sort((a, b) => b.key - a.key);
    keyed.forEach((entry, i) => {
      array[i] = entry.card;
    });
    return array;
  }

  /**
   * Simple Fisher-Yates shuffle for basic randomization
   * Use this when you don't need educational weighting
   */
  static basicShuffle(array) {
    if (!array || array.length <= 1) return array;

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  /**
   * Kept for existing callers: one Fisher-Yates pass is already uniformly random, so more passes
   * add nothing.
   */
  static multiShuffle(array) {
    return this.basicShuffle(array);
  }
}

// Make ShuffleUtils available globally
(typeof window !== "undefined" ? window : globalThis).ShuffleUtils = ShuffleUtils;
