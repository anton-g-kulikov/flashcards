// The stored shape of collections and cards. No Firebase here: the tests import it directly.

// The collection a first visit gets, so there is always somewhere to put words
export const DEFAULT_COLLECTION = "default";

// Cards per collection. Matches the cards.size() limit in firestore.rules and MAX_ROWS in
// utils/csv.js. Typical words keep 5,000 cards at a few hundred KB, but long ones could pass
// Firestore's 1 MiB per document, so the size is checked too (MAX_CARDS_BYTES).
export const MAX_CARDS = 5000;

// How much of a collection document its cards may take, leaving room under Firestore's 1 MiB
// (1,048,576 bytes) for the name and the other fields
export const MAX_CARDS_BYTES = 1_000_000;

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

const utf8Length = (text) => new TextEncoder().encode(text).length;

// The size Firestore counts for a cards list: every string (field names included) is its UTF-8
// length plus one byte; "id", "word" and "translation" make 20 bytes per card.
export function cardsSize(cards) {
  return cards.reduce(
    (sum, card) => sum + 20 + utf8Length(card.id) + utf8Length(card.word) + utf8Length(card.translation) + 3,
    0
  );
}
