# Test Documentation

## Automated: Firestore security rules (`firestore.rules.test.js`)

Run with `npm test` (Firestore emulator, Node's built-in test runner).

| Case | Expectation |
| --- | --- |
| Old one-per-document card: owner reads or deletes it | allowed (for the move into collections) |
| Old one-per-document card: anyone creates or changes one | denied |
| Old card read or deleted by another user or a signed-out visitor | denied |
| Collection with up to 5,000 cards in its `cards` list | allowed; 5,001, or `cards` not a list, denied |
| Owner saves and reads own progress | allowed |
| Another user reads or writes someone's progress | denied |
| Progress with an unexpected field | denied |
| User document, or any other `meta/*` document | denied |

## Automated: CSV and starter collections (`csv.test.js`)

| Case | Expectation |
| --- | --- |
| Quotes, embedded commas, doubled quotes, CRLF, BOM, newlines in quotes | parsed correctly |
| Header in any column order; no header | uses `word`/`translation` columns, else the first two |
| Empty and repeated words | skipped, and counted (`readCards`) so the import can report them |
| More than 5,000 words | the first 5,000 imported, the rest counted as left out |
| Export then import | round-trips exactly |
| Every file in `public/collections/` | listed in `index.json` with the right word count, no empty fields |
| Spanish words across starter collections | never repeated |

Collection documents and a card's `collectionId` / a collection's `active` flag are covered in
`firestore.rules.test.js`.

## Automated: stored cards and the move out of one-per-document cards (`card-data.test.js`)

| Case | Expectation |
| --- | --- |
| Card fields | only word and translation, trimmed and cut to length; list items without id or word dropped |
| Old cards naming an existing collection | appended after its cards, ids kept |
| Old cards without a collection, or whose collection is gone | into a new default collection |
| Cards already moved | skipped, so an interrupted move can rerun |
| More than 5,000 cards for one collection | the rest in "<name> (2)", "<name> (3)"... |

## Automated: study logic (`study.test.js`, `shuffle.test.js`)

| Case | Expectation |
| --- | --- |
| Mark known / unknown | known set and last-seen time updated |
| Unknown cards, known count | in order; counted within the given cards |
| Reset | only the given cards forgotten |
| Saved progress | leaves out cards that no longer exist; loading copies the saved data |
| Quiz pool | unknown cards with a non-blank translation |
| Question | drawn from the first 80% of the (weighted) pool, or all of a pool of 5 or fewer |
| Options | the right card plus up to 3 others, no two reading the same, right card in any position |
| Right answer | first try: known, leaves the pool; after a wrong one: stays unknown |
| Next step | ask while 2+ words left, then the last word, then done |
| Card order | a permutation, stale cards earlier on average, 5,000 cards in under 200 ms |

## Automated: app shell (`app-shell.test.js`) and XSS guard (`xss.test.js`)

| Case | Expectation |
| --- | --- |
| `sw.js` cache name | `flashcards-v` + `VERSION` from `src/core/version.js` |
| Every page, script and stylesheet | in the precache list; every precached file exists |
| `innerHTML` templates in `public/src` | interpolate card text only through `I18n.escape` |

## Manual: end-to-end on the emulators

With `npm run dev`, at http://127.0.0.1:5050:

1. Signed out, both pages show only the sign-in screen.
2. Sign in (emulator popup or `Cloud.signInForTesting()`): the account chip shows the name.
3. My Cards: add a word with and without a translation; adding the same word again (any case)
   is refused; editing a translation and deleting a word persist after reload.
4. Study: quiz options are the collection's translations; untranslated words are left out of the
   quiz; flashcards flip to the translation ("No translation yet" when missing). Keyboard: Tab
   reaches the mode buttons, quiz options and the flashcard; Enter or Space answers or flips.
   With one quiz word left, the page switches to Flashcards with that word first.
5. Answer a quiz question correctly, reload: the known count is kept. Reset Progress needs a
   second tap ("Tap again to reset these words"); after it, the known count is 0, also after a
   reload. Delete in My Cards likewise needs a second tap ("Sure?"). These replace `confirm()`,
   which embedded browsers can suppress (a suppressed dialog returns false and cancels).
6. Sign out and in as a different account: the collection is empty.
7. Old layout: with rules bypassed (REST with `Authorization: Bearer owner`), create
   `users/{uid}/cards/*` documents, some naming a collection and some not. Opening My Cards moves
   them into their collections (orphans into the default one) and the old documents are gone.
