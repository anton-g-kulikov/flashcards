// The stored shape of collections and cards, and the plan for moving cards out of the old
// one-document-per-card layout. No Firebase here: the tests import it directly.

// Cards saved before collections existed have no collectionId; they belong to this one.
export const DEFAULT_COLLECTION = "default";

// Cards per collection. Matches the cards.size() limit in firestore.rules and MAX_ROWS in
// utils/csv.js; it keeps a collection document well under Firestore's 1 MiB.
export const MAX_CARDS = 5000;

// Longest word and translation kept; longer ones are cut (and an import says how many)
export const WORD_MAX = 200;
export const TRANSLATION_MAX = 500;

const text = (value, max) => String(value ?? "").trim().slice(0, max);

export function collectionName(name) {
  return text(name, 100);
}

// A card as stored in its collection's `cards` list. Rules can't check list items, so this is
// what keeps them to these fields and lengths.
export function cardFields(card) {
  return { word: text(card.word, WORD_MAX), translation: text(card.translation, TRANSLATION_MAX) };
}

// The `cards` list read from a collection document, cleaned up
export function storedCards(list) {
  return (Array.isArray(list) ? list : [])
    .map((card) => ({ id: text(card?.id, 100), ...cardFields(card || {}) }))
    .filter((card) => card.id && card.word);
}

// Where the old one-per-document cards go: each into the collection it names, or the default
// collection when that one is gone (it is created if needed). Cards already moved (same id) are
// skipped, so an interrupted move can simply run again. A collection that would pass MAX_CARDS
// overflows into new collections named "<name> (2)", "<name> (3)"...
//
// Returns the collection documents to write: { id, name, isNew, cards }.
export function planMigration(collections, legacyCards, defaultName, newId) {
  const existing = new Map(collections.map((c) => [c.id, c]));
  const groups = new Map();
  for (const card of legacyCards) {
    const target = existing.has(card.collectionId) ? card.collectionId : DEFAULT_COLLECTION;
    if (!groups.has(target)) groups.set(target, []);
    groups.get(target).push(card);
  }

  const writes = [];
  for (const [id, cards] of groups) {
    const collection = existing.get(id);
    const name = collection ? collection.name : collectionName(defaultName);
    const merged = [...(collection?.cards || [])];
    const ids = new Set(merged.map((card) => card.id));
    for (const card of storedCards(cards)) {
      if (!ids.has(card.id)) {
        ids.add(card.id);
        merged.push(card);
      }
    }
    writes.push({ id, name, isNew: !collection, cards: merged.slice(0, MAX_CARDS) });
    for (let start = MAX_CARDS, part = 2; start < merged.length; start += MAX_CARDS, part++) {
      writes.push({
        id: newId(),
        name: collectionName(`${name} (${part})`),
        isNew: true,
        cards: merged.slice(start, start + MAX_CARDS),
      });
    }
  }
  return writes;
}
