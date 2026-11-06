# Test Documentation

## Automated: Firestore security rules (`firestore.rules.test.js`)

Run with `npm test` (Firestore emulator, Node's built-in test runner).

| Case | Expectation |
| --- | --- |
| The old card path (`users/{uid}/cards`), even the owner's | denied |
| Owner deletes every collection and the progress record in one batch (account deletion) | allowed |
| Another user deletes someone's collections or progress | denied |
| Collection with up to 5,000 cards in its `cards` list | allowed; 5,001, or `cards` not a list, denied |
| Owner saves and reads own progress | allowed |
| Another user reads or writes someone's progress | denied |
| Progress with an unexpected field | denied |
| Spaced-repetition entries merged in one card at a time, forgotten with `deleteField` | allowed, and merged correctly |
| Progress with the old `known` or `history` fields | denied |
| More than 20,000 `srs` entries | denied |
| A collection's `language`: a string of up to 5 characters | allowed; longer, or not a string, denied |
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
| Export then import | round-trips exactly, languages included |
| Header of language codes (`es,en`, `es,translation`) | read as a header; sets `language`, either side may be missing |
| First row with only one column name or code (`es,yes`) | read as a word, no language |
| Anki text export (`#separator:`, `#html:`, `#… column:` lines) | follows those lines, skips meta columns, removes markup and sound references |
| Tab in the first line, no Anki lines | read as tab-separated |
| Ordinary CSV starting with `#` | not mistaken for Anki |
| Every file in `public/collections/` | listed in `index.json` with the right word count, no empty fields |
| Words across a language pair's A1/A2 series | never repeated |
| Language pairs | each has the same eight collections |

Collection documents and a card's `collectionId` / a collection's `active` flag are covered in
`firestore.rules.test.js`.

## Automated: stored card shape (`card-data.test.js`)

| Case | Expectation |
| --- | --- |
| Card fields | only word and translation, trimmed and cut to length; list items without id or word dropped |
| Collection size | counted as Firestore does (UTF-8 bytes plus one per string, field names included); 5,000 typical cards far below the 1 MB budget, 5,000 longest cards over it |

## Automated: study logic (`study.test.js`, `shuffle.test.js`)

| Case | Expectation |
| --- | --- |
| Known word | up one box, due after that box's interval (1, 3, 7, 16, 35 days); box 5 stays 5 |
| Word not known | box 1, due now |
| Mode the page opens in | a shortcut's `?mode=` first, then the mode last chosen on the device, else quiz; unknown values ignored |
| A drag on a flashcard | sideways or up and down once it has moved 10 px; a swipe past 30% of the card's width, at most 100 px |
| Missed flashcard | back in the deck behind the next 3 cards, or last when fewer are left |
| Needs study | new words and words due; not words scheduled later |
| Study queue | due words first, oldest day first, same-day ones shuffled; then new words; nothing not due |
| Stats | due (new included), learning, mastered, average box; next review time |
| Saved progress | only the changed entries, the latest per word; reset and pruning forget entries; unsaved changes go back unless newer ones replaced them; malformed entries ignored |
| Quiz pool | queued words with a translation |
| Question | first in the queue not asked in the last 3 questions, so a missed word returns after 3 others; otherwise the word asked longest ago |
| Options | the right card plus up to 3 others from any translated word, no two reading the same, right card in any position |
| Shuffle | a permutation, any item can come first, 5,000 items quickly |

## Automated: appearance (`theme.test.js`)

| Case | Expectation |
| --- | --- |
| Stored preference | "system" unless "light" or "dark" |
| `data-theme` | none for "system", the choice otherwise |
| `theme-init.js` | same storage key and colours as `theme.js`; dark page background matches the dark browser-chrome colour |
| Every page | loads `theme-init.js` before its stylesheet, after a `theme-color` tag per scheme |

## Automated: reading aloud (`speech.test.js`, `card-data.test.js`)

| Case | Expectation |
| --- | --- |
| Finding a voice | by language, whatever the region or spelling (`es-ES`, `es_MX`); on-device preferred, online as fallback; none for a missing language; `est` isn't `es` |
| What can be spoken | one to ten words |
| First word after a page load | a silent sound plays first to wake the audio; later words go straight out; only what's playing gets cancelled |
| Language pair | `es-en` read and written, either side optional; unknown codes count as not set |
| Starter collections | each names a known language pair |

## Automated: app shell (`app-shell.test.js`) and XSS guard (`xss.test.js`)

| Case | Expectation |
| --- | --- |
| `sw.js` cache name | `flashcards-v` + `VERSION` from `src/core/version.js` |
| Every page, script and stylesheet | in the precache list; every precached file exists |
| Every `innerHTML` / `outerHTML` assignment in `public/src` | an empty string, a template whose parts are translation text, or one of the reviewed sinks listed in the test; `insertAdjacentHTML` and `document.write` not used; a planted `innerHTML = card.word` fails |
| Deployed security policy | no `127.0.0.1` or `localhost`; the dev config adds the emulator addresses |
| Footer, on both pages | starts collapsed and inert, and holds the appearance switch and the cookie note |
| Translations | same keys in English, Russian and Spanish; every key used in the pages exists |
| Landing page | 7 feature cards reachable by keyboard, sign-in at both ends, its text in the HTML, a language filter here and in My Cards |
| iOS launch screens | every size in `scripts/launch-images.txt` has a light and a dark image, linked from both pages with matching media queries; no unlisted image |

## Automated: search engines (`crawl.test.js`)

| Case | Expectation |
| --- | --- |
| `robots.txt` | allows every crawler; names `https://yourflashcards.app/sitemap.xml` |
| `sitemap.xml` | lists `/`, `/privacy.html` and every word list page on `https://yourflashcards.app`; every listed URL is a file in `public` |
| Canonical addresses | the study page and Privacy each name theirs on `https://yourflashcards.app` |
| My Cards | `noindex`, and not blocked in `robots.txt`, so crawlers can read that |
| Study page title | the same in the HTML, `og:title` and the English `app.pageTitle`; translated in all three languages; at most 60 characters |
| Link previews | `og:description` matches the page's description; `og:image` is on the site and exists |
| JSON-LD | parses, and names the site as a `WebSite` at the canonical address |
| Word list pages | one per starter collection and none extra; the same as a fresh `scripts/make-word-lists.js` run; every word shown; unique titles (at most 60 characters) and descriptions (at most 160); a canonical address; links only to pages that exist; nothing inline; linked from the landing table; all in the sitemap |
| Word list page language | all text comes in English, Russian and Spanish; `word-list-language.js` leaves a page as written with nothing saved, never reads the browser's language, shows a saved language and ignores an unknown one; it reads the app's storage key, and app pages save the language in use |

## Automated: plural forms (`plurals.test.js`)

| Case | Expectation |
| --- | --- |
| Word counts | 0, 1, 2, 5, 21 and a million read correctly in English and Spanish |
| Verbs | agree with the count in English and Spanish, and in Russian for 1, 2, 5, 21 and 22 |
| Russian forms | `{count\|one\|few\|many}` picks the form for 1, 2, 5, 11, 21 and 22 |
| Every plural in the table | has two forms in English and Spanish and three in Russian, and names a number the callers pass |
| Plain `{count}` | still fills in, and a missing variable stays as written |

## Manual: end-to-end on the emulators

With `npm run dev`, at http://127.0.0.1:5050:

1. Signed out, both pages show only the sign-in screen.
2. Sign in (the emulator's redirect page or `Cloud.signInForTesting()`): the account chip shows
   the name.
3. My Cards: add a word with and without a translation; adding the same word again (any case)
   is refused; editing a word or a translation in place and deleting a word persist after reload.
   A word can't be changed to empty or to one the collection already has (it reverts, with
   "already in your collection"). Long words and translations wrap at phone width, in the list
   and in the add form; Enter in the add form adds the word.
4. Study: quiz options are the collection's translations; untranslated words are left out of the
   quiz; flashcards flip to the translation ("No translation yet" when missing). Keyboard: Tab
   reaches the mode buttons, quiz options and the flashcard; Enter or Space answers or flips.
   In Flash Mode, "I Don't Know" turns the card over and becomes a neutral "Next". A tap only turns
   the card back and forth; only Next moves on, and the next card shows "I Don't Know" again. A known card slides off to
   the right, a missed one to the left, without widening the page; the next word fades in front
   up, so its translation never shows. Dragging the card follows the finger: past about 100 px
   a swipe right counts as known, a swipe left as "I Don't Know" (or Next once the meaning has been
   shown); a shorter drag springs back without turning the card, and dragging up and down scrolls.
5. Answer a quiz question correctly, reload: the Learning count is kept. Reset Progress needs a
   second tap ("Tap again to reset these words"); after it, every word is due again, also after a
   reload. Delete in My Cards likewise needs a second tap ("Sure?"). These replace `confirm()`,
   which embedded browsers can suppress (a suppressed dialog returns false and cancels).
6. Sign out and in as a different account: the collection is empty.
7. Two tabs of the same account: answer different words in each, wait 2 seconds, reload: the
   Learning count includes both.
8. Spaced repetition: with three new words, miss one in the quiz (it comes back after another
   word), answer the rest; the "All caught up" card says the next review is tomorrow. Reset
   Progress makes all three due again. At phone width, the stats row fits in all three languages.
9. Appearance: open the footer and pick Dark; My Cards and the privacy page open dark, with no
   light flash. Light holds while the device is dark; "Match the device" follows the device again.
10. Cookie note: in the footer of both pages and on the sign-in screen. "Turn off analytics" deletes
   the `_ga` cookies and switches the note to "Analytics is off on this device"; after a reload no
   googletagmanager script loads (check on a deployed site, it never loads on localhost). "Turn it
   back on" restores it.
11. Account deletion: on My Cards, "Delete my account" asks for a second tap, then lands on the
   sign-in screen with "Your account and all your words were deleted." On the emulators no
   collection, progress record or Auth user is left for that account. With a sign-in older than 4
   minutes, Google's popup asks to confirm first; closing it deletes nothing.
12. Footer: on Study and My Cards it starts collapsed, also after a reload, with only the tab on
   the divider showing, at the bottom of the screen on a short page and after the content on a
   long one. The tab opens it (the arrow turns, the page scrolls it into view) and
   closes it; while closed, nothing in it can be reached with the keyboard.
13. Reading aloud: in My Cards set a collection's languages (it survives a reload; importing a
   starter collection sets them by itself). In Flash Mode each face gets a speaker button, which
   speaks in that side's language without turning the card, and isn't reachable while its face is
   turned away. In Quiz Mode it follows the question. No language, more than ten words, or no voice
   on the device: no button, and My Cards says which voice is missing. Try it on a real iPhone,
   including with the silent switch on and in the installed app.
14. Study mode: choose Flash Mode and reload: it opens in Flash Mode, with no flash of the quiz.
   `/?mode=quiz` opens the quiz for that visit without changing the remembered mode.
15. Landing page: signed out, the study page explains the app. Cards are plain in front and coloured
   behind, say "Tap to turn" only on hover or keyboard focus, and wiggle once when fully in
   view. They turn with a tap, Enter or Space and their text fits in all three languages, at phone and desktop width and in dark mode (Russian
   on the narrow three-across cards is the tightest). Both sign-in buttons work. My Cards signed out
   still shows the plain sign-in card.
16. Language order: in My Cards the arrow between the languages points away from the side shown
   first, and its hover text names that side. Tap it and reload: it stays swapped. In Flash Mode the
   face shows the translation and the speaker uses that side's language; in Quiz Mode the question
   is the translation and the options are the original words. A word with no translation still
   shows the word. With a normal collection also on, a reversed question's options stay in one
   language while enough words allow it. Tap the arrow again to go back.
17. CSV languages: import a file with the header `es,en`: the collection arrives with Spanish and
   English set. Export it: the first line is `es,en`. A `word,translation` file imports with no
   languages, and its export keeps that header.
18. Anki import: in Anki, export a deck as Notes in Plain Text, with and without HTML, and import the
   `.txt` from My Cards. The words and translations are clean, with one card per note, and the
   collection is named after the file. Try the file picker on an iPhone: `.txt` files must be
   selectable.
19. Direction while studying: below the cards in both modes, the button shows "Spanish → English",
   or "Word → Translation" when the collections have different languages or none. Tap it: the cards
   and quiz turn round straight away, every collection switched on follows, and it stays after a
   reload. With only some collections reversed it shows ⇄, and one tap reverses them all. With no
   translations at all there is no button.
20. Landing table: signed out, "Ready-made collections" lists every starter collection and fits at phone
   width in all three languages and in dark mode. Its button starts Google sign-in.
21. Language filter: the dropdown above the landing table and the one under Import in My Cards list
   every language pair in the interface language. Choosing one leaves only its collections, and
   switching the interface language keeps the choice.
22. Landing demo: signed out, tap, swipe and both buttons work in Flash Mode as they do in the app,
   and a missed word comes back after the others. In Quiz Mode a wrong pick turns over. Both end on
   a card whose button starts sign-in. Switching mode or language starts over. Spanish shows English
   words. After signing in, the app's own mode buttons work and the study numbers are untouched by
   the demo. Try the swipe with a finger on a real phone.
