// What the user knows: the ids of the cards marked known, and when each card was last seen.
// Saved to the account, so progress follows the user to every device. No DOM here: the tests
// import it directly.
//
// Every change is also recorded as pending, and saving sends only those changes (Cloud.
// saveProgressChanges), never the whole record: two devices, or a tab left open since yesterday,
// then add to each other's progress instead of overwriting it.
export class Progress {
  constructor({ known = [], history = {} } = {}) {
    this.known = new Set(known);
    this.history = { ...history };
    this.pendingKnown = new Map(); // id → true (known) or false (not known)
    this.pendingHistory = new Map(); // id → last seen (ms), or null to forget it
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
    this.pendingHistory.set(id, now);
  }

  markKnown(id, now = Date.now()) {
    this.known.add(id);
    this.pendingKnown.set(id, true);
    this.seen(id, now);
  }

  markUnknown(id, now = Date.now()) {
    this.known.delete(id);
    this.pendingKnown.set(id, false);
    this.seen(id, now);
  }

  // Forgets the given cards: unknown again, never seen
  reset(ids) {
    for (const id of ids) {
      if (this.known.delete(id)) this.pendingKnown.set(id, false);
      if (id in this.history) {
        delete this.history[id];
        this.pendingHistory.set(id, null);
      }
    }
  }

  // Forgets cards that no longer exist, so deleted ones don't linger in the saved record.
  // Returns whether there was anything to forget.
  prune(existingIds) {
    const gone = new Set(
      [...this.known, ...Object.keys(this.history)].filter((id) => !existingIds.has(id))
    );
    this.reset(gone);
    return gone.size > 0;
  }

  hasChanges() {
    return this.pendingKnown.size > 0 || this.pendingHistory.size > 0;
  }

  // The changes since the last call, for saving: { knownAdd, knownRemove, history } where
  // history maps a card id to when it was seen, or null to forget it
  takeChanges() {
    const changes = { knownAdd: [], knownRemove: [], history: Object.fromEntries(this.pendingHistory) };
    for (const [id, known] of this.pendingKnown) {
      (known ? changes.knownAdd : changes.knownRemove).push(id);
    }
    this.pendingKnown.clear();
    this.pendingHistory.clear();
    return changes;
  }

  // Puts back changes that could not be saved, unless newer ones replaced them meanwhile
  restoreChanges({ knownAdd, knownRemove, history }) {
    const keep = (map, id, value) => {
      if (!map.has(id)) map.set(id, value);
    };
    knownAdd.forEach((id) => keep(this.pendingKnown, id, true));
    knownRemove.forEach((id) => keep(this.pendingKnown, id, false));
    Object.entries(history).forEach(([id, time]) => keep(this.pendingHistory, id, time));
  }
}
