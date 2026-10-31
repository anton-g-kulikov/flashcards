# Test Documentation

## Automated: Firestore security rules (`firestore.rules.test.js`)

Run with `npm test` (Firestore emulator, Node's built-in test runner).

| Case | Expectation |
| --- | --- |
| Owner creates, reads, updates, deletes own card | allowed |
| Card with only a `word` | allowed |
| Another user reads, writes or deletes someone's card | denied |
| Signed-out visitor reads or writes a card | denied |
| Card with an unknown field, no word, empty or >200-char word, non-string translation | denied |
| Owner saves and reads own progress | allowed |
| Another user reads or writes someone's progress | denied |
| Progress with an unexpected field | denied |
| User document, or any other `meta/*` document | denied |

## Automated: CSV and starter collections (`csv.test.js`)

| Case | Expectation |
| --- | --- |
| Quotes, embedded commas, doubled quotes, CRLF, BOM, newlines in quotes | parsed correctly |
| Header in any column order; no header | uses `word`/`translation` columns, else the first two |
| Empty and repeated words | skipped |
| Export then import | round-trips exactly |
| Every file in `public/collections/` | listed in `index.json` with the right word count, no empty fields |
| Spanish words across starter collections | never repeated |

Collection documents and a card's `collectionId` / a collection's `active` flag are covered in
`firestore.rules.test.js`.

## Manual: end-to-end on the emulators

With `npm run dev`, at http://127.0.0.1:5050:

1. Signed out, both pages show only the sign-in screen.
2. Sign in (emulator popup or `Cloud.signInForTesting()`): the account chip shows the name.
3. My Words: add a word with and without a translation; adding the same word again (any case)
   is refused; editing a translation and deleting a word persist after reload.
4. Study: quiz options are the collection's translations; untranslated words are left out of the
   quiz; flashcards flip to the translation ("No translation yet" when missing).
5. Answer a quiz question correctly, reload: the known count is kept. Reset Progress needs a
   second tap ("Tap again to reset all progress"); after it, the known count is 0, also after a
   reload. Delete in My Words likewise needs a second tap ("Sure?"). These replace `confirm()`,
   which embedded browsers can suppress (a suppressed dialog returns false and cancels).
6. Sign out and in as a different account: the collection is empty.
