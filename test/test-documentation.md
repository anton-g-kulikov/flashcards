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
| Spaced-repetition entries merged in one card at a time, old fields deleted (`deleteField`) | allowed, and merged correctly |
| A whole-record rewrite without `srs` once `srs` exists (an old version's save) | denied |
| More than 20,000 `srs` entries | denied |
| `updatedAt` other than the server's clock, on progress or a collection | denied |
| User document, or any other `meta/*` document | denied |

## Automated: CSV and starter collections (`csv.test.js`)

| Case | Expectation |
| --- | --- |
| Quotes, embedded commas, doubled quotes, CRLF, BOM, newlines in quotes | parsed correctly |
| Header in any column order; no header | uses `word`/`translation` columns, else the first two |
| Empty and repeated words | skipped, and counted (`readCards`) so the import can report them |
| More than 5,000 words | the first 5,000 imported, the rest counted as left out |
| Word over 200 or translation over 500 characters | counted as shortened, so the import can say so |
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
| Known word | up one box, due after that box's interval (1, 3, 7, 16, 35 days); box 5 stays 5 |
| Word not known | box 1, due now |
| Needs study | new words and words due; not words scheduled later |
| Study queue | due words first, oldest day first, same-day ones shuffled; then new words; nothing not due |
| Stats | due (new included), learning, mastered, average box; next review time |
| Saved progress | only the changed entries, the latest per word; reset and pruning forget entries; unsaved changes go back unless newer ones replaced them; malformed entries ignored |
| Progress from before spaced repetition | known words to box 2, due now; old fields dropped with the first save |
| Quiz pool | queued words with a translation |
| Question | first in the queue, not the same word twice in a row while there's another |
| Options | the right card plus up to 3 others from any translated word, no two reading the same, right card in any position |
| Shuffle | a permutation, any item can come first, 5,000 items quickly |

## Automated: appearance (`theme.test.js`)

| Case | Expectation |
| --- | --- |
| Stored preference | "system" unless "light" or "dark" |
| `data-theme` | none for "system", the choice otherwise |
| `theme-init.js` | same storage key and colours as `theme.js`; dark page background matches the dark browser-chrome colour |
| Every page | loads `theme-init.js` before its stylesheet, after a `theme-color` tag per scheme |

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
8. Two tabs of the same account: answer different words in each, wait 2 seconds, reload: the
   Learning count includes both.
9. Spaced repetition: with three new words, miss one in the quiz (it comes back after another
   word), answer the rest; the "All caught up" card says the next review is tomorrow. Reset
   Progress makes all three due again. At phone width, the stats row fits in all three languages.
10. Appearance: pick Dark at the foot of Study; My Cards and the privacy page open dark, with no
   light flash. Light holds while the device is dark; "Match the device" follows the device again.
