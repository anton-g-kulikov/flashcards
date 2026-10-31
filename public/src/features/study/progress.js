// Spaced repetition (Leitner boxes): what the user has learned, and when each word comes back.
//
// Every word sits in a box from 0 (new) to 5 (mastered) with a due date. Knowing a word moves it
// up a box and schedules it further out (INTERVAL_DAYS); not knowing it drops it to box 1, due
// again straight away. Each session studies what is due, oldest first, then new words.
//
// Saved to the account as `srs: { cardId: { box, due } }`, so it follows the user to every
// device. Every change is also recorded as pending, and saving sends only those entries
// (Cloud.saveProgressChanges): two devices, or a tab left open since yesterday, add to each
// other's progress instead of overwriting it. No DOM here: the tests import it directly.
import { shuffle } from "../../utils/shuffle-utils.js";

export const DAY = 24 * 60 * 60 * 1000;
// Days until a word in each box is due again; box 0 is new, box 5 is mastered
export const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
export const MASTERED = INTERVAL_DAYS.length - 1;

function validEntry(entry) {
  return (
    entry &&
    Number.isInteger(entry.box) &&
    entry.box >= 1 &&
    entry.box <= MASTERED &&
    Number.isFinite(entry.due)
  );
}

export class Progress {
  // `saved` is the stored record, { srs }
  constructor({ srs = {} } = {}) {
    this.srs = {};
    this.pending = new Map(); // card id → { box, due }, or null to forget it
    for (const [id, entry] of Object.entries(srs)) {
      if (validEntry(entry)) this.srs[id] = { box: entry.box, due: entry.due };
    }
  }

  set(id, entry) {
    if (entry) this.srs[id] = entry;
    else delete this.srs[id];
    this.pending.set(id, entry);
  }

  box(id) {
    return this.srs[id]?.box ?? 0;
  }

  // New words and words whose review is due
  needsStudy(id, now = Date.now()) {
    const entry = this.srs[id];
    return !entry || entry.due <= now;
  }

  // Knew it: up a box, back after that box's interval
  right(id, now = Date.now()) {
    const box = Math.min(this.box(id) + 1, MASTERED);
    this.set(id, { box, due: now + INTERVAL_DAYS[box] * DAY });
  }

  // Didn't: box 1, due again now (it comes back later in this session)
  wrong(id, now = Date.now()) {
    this.set(id, { box: 1, due: now });
  }

  // What to study now: due words, oldest due first (words due the same day in random order, so
  // no sequence can be learned), then new words in random order
  studyQueue(cards, now = Date.now(), random = Math.random) {
    const due = [];
    const fresh = [];
    for (const card of cards) {
      const entry = this.srs[card.id];
      if (!entry) fresh.push(card);
      else if (entry.due <= now) due.push(card);
    }
    const order = new Map(due.map((card) => [card.id, [Math.floor(this.srs[card.id].due / DAY), random()]]));
    due.sort((a, b) => {
      const [dayA, tieA] = order.get(a.id);
      const [dayB, tieB] = order.get(b.id);
      return dayA - dayB || tieA - tieB;
    });
    return [...due, ...shuffle(fresh, random)];
  }

  // The stats row: words to study now (due or new), learning (boxes 1–4, not due), mastered
  // (box 5, not due), and `level`, the average box as a share of mastery (0 to 1)
  stats(cards, now = Date.now()) {
    const stats = { due: 0, learning: 0, mastered: 0, level: 0 };
    let boxes = 0;
    for (const card of cards) {
      boxes += this.box(card.id);
      if (this.needsStudy(card.id, now)) stats.due++;
      else if (this.box(card.id) === MASTERED) stats.mastered++;
      else stats.learning++;
    }
    stats.level = cards.length ? boxes / (cards.length * MASTERED) : 0;
    return stats;
  }

  // When the next of these cards comes due, or null if none is scheduled
  nextDue(cards) {
    const dues = cards.map((card) => this.srs[card.id]?.due).filter((due) => due !== undefined);
    return dues.length ? Math.min(...dues) : null;
  }

  // Back to new: forgets the given cards
  reset(ids) {
    for (const id of ids) {
      if (this.srs[id]) this.set(id, null);
    }
  }

  // Forgets cards that no longer exist, so deleted ones don't linger in the saved record.
  // Returns whether there was anything to forget.
  prune(existingIds) {
    const gone = Object.keys(this.srs).filter((id) => !existingIds.has(id));
    this.reset(gone);
    return gone.length > 0;
  }

  hasChanges() {
    return this.pending.size > 0;
  }

  // The changes since the last call, for saving: { srs: { id: entry or null } }
  takeChanges() {
    const changes = { srs: Object.fromEntries(this.pending) };
    this.pending.clear();
    return changes;
  }

  // Puts back changes that could not be saved, unless newer ones replaced them meanwhile
  restoreChanges({ srs }) {
    for (const [id, entry] of Object.entries(srs)) {
      if (!this.pending.has(id)) this.pending.set(id, entry);
    }
  }
}
