// The words on the landing page's demo. No DOM here: the tests import it directly.

const WORDS = [
  { id: "house", es: "la casa", en: "house", ru: "дом" },
  { id: "dog", es: "el perro", en: "dog", ru: "собака" },
  { id: "book", es: "el libro", en: "book", ru: "книга" },
  { id: "water", es: "el agua", en: "water", ru: "вода" },
  { id: "read", es: "leer", en: "to read", ru: "читать" },
];

// Cards in the shape the study modes take: Spanish words with translations in the visitor's
// language, or English ones for a Spanish speaker, who has nothing to learn from Spanish
export function demoCards(lang) {
  const word = lang === "es" ? "en" : "es";
  return WORDS.map((entry) => ({
    id: entry.id,
    word: entry[word],
    translation: entry[lang],
    languages: { word, translation: lang },
  }));
}
