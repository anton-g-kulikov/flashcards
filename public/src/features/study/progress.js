// What the user knows: the ids of the cards marked known, and when each card was last seen.
// Saved to the account, so progress follows the user to every device. No DOM here: the tests
// import it directly.
export class Progress {
  constructor({ known = [], history = {} } = {}) {
    this.known = new Set(known);
    this.history = { ...history };
  }

  isKnown(id) {
    return this.known.has(id);
  }

  // The cards not known yet, in their given order
  unknown(cards) {
    return cards.filter((card) => !this.known.has(card.id));
  }

  knownCount(cards) {
    return cards.length - this.unknown(cards).length;
  }

  seen(id, now = Date.now()) {
    this.history[id] = now;
  }

  markKnown(id, now = Date.now()) {
    this.known.add(id);
    this.seen(id, now);
  }

  markUnknown(id, now = Date.now()) {
    this.known.delete(id);
    this.seen(id, now);
  }

  // Forgets the given cards: unknown again, never seen
  reset(ids) {
    for (const id of ids) {
      this.known.delete(id);
      delete this.history[id];
    }
  }

  // The saved form, leaving out cards that no longer exist so deleted ones don't linger
  toSaved(existingIds) {
    const history = {};
    for (const [id, time] of Object.entries(this.history)) {
      if (existingIds.has(id)) history[id] = time;
    }
    return { known: [...this.known].filter((id) => existingIds.has(id)), history };
  }
}
